import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
  type HttpClientRequest,
  type HttpClientResponse,
} from '@effect/platform/index'
import {
  Array,
  Deferred,
  Duration,
  Effect,
  FiberId,
  FiberRef,
  Layer,
  Option,
  Schema,
} from 'effect'
import {globalValue} from 'effect/GlobalValue'
import {readMigrationControlRecord} from '../utils/deviceMigration/controlStore'

/**
 * Vexl egress gate (device migration spec, section "Vexl HTTP transport").
 *
 * Every mobile Vexl HTTP request flows through {@link vexlGatedHttpClientLayer}
 * instead of a raw `FetchHttpClient.layer`. The gate:
 *
 * - reads the migration control mode SYNCHRONOUSLY per request (clients are
 *   cached, so a per-client check would go stale);
 * - in any non-'normal' mode fails BEFORE the wrapped client runs — no DNS
 *   resolution, no socket;
 * - in 'destinationActivating' lets through only requests wrapped in
 *   {@link withAllowedVexlOperations} (typed operation identifiers, never URL
 *   matching);
 * - tracks the number of in-flight requests so source quiescence can drain
 *   them ({@link drainAndBlockVexlRequests}) and races every request against a
 *   gate-closing signal so interruptible in-flight requests are cancelled when
 *   the drain starts.
 *
 * PRIVACY: nothing here may report anything anywhere. Failures are typed
 * errors surfaced to the caller only.
 */

/**
 * Typed identifiers for the narrow destination-activation allowlist. These
 * are mobile-owned (they gate mobile egress, they are not protocol data).
 *
 * - 'notificationTokenUpdate': the ordinary notification-metadata update for
 *   the migrated Vexl secret (new Expo token upload).
 * - 'accountReconciliation': the ordinary post-login account reconciliation
 *   (user/contact/offer/chat refresh) required before normal mode.
 */
export const AllowedVexlOperationId = Schema.Literal(
  'notificationTokenUpdate',
  'accountReconciliation'
)
export type AllowedVexlOperationId = typeof AllowedVexlOperationId.Type

/**
 * A Vexl request was refused by the device-migration egress gate. Carries no
 * fields on purpose — anything more could leak migration metadata if the
 * error ever reaches error reporting.
 */
export class VexlEgressBlockedError extends Schema.TaggedError<VexlEgressBlockedError>(
  'VexlEgressBlockedError'
)('VexlEgressBlockedError', {}) {}

/**
 * The in-flight request drain did not reach zero active requests within the
 * allotted time. Quiescence must fail and restore normal mode
 * ({@link reopenVexlRequests}).
 */
export class DrainTimeoutError extends Schema.TaggedError<DrainTimeoutError>(
  'DrainTimeoutError'
)('DrainTimeoutError', {}) {}

interface VexlEgressGateState {
  /**
   * Blocks every new request independently of the control mode. Used by the
   * quiescence drain: the control record is written first anyway, but the
   * flag keeps the gate closed even before/without a mode change and lets a
   * failed quiescence restore normal operation without touching the record.
   */
  manuallyBlocked: boolean
  activeRequestCount: number
  /**
   * Completed when the gate starts closing. Every in-flight request races
   * against it, so completing it interrupts interruptible requests.
   * Re-created by {@link reopenVexlRequests}.
   */
  closeDeferred: Deferred.Deferred<undefined>
}

const gateState = globalValue(
  Symbol.for('@vexl-next/mobile/api/vexlEgressGateState'),
  (): VexlEgressGateState => ({
    manuallyBlocked: false,
    activeRequestCount: 0,
    closeDeferred: Deferred.unsafeMake<undefined>(FiberId.none),
  })
)

/**
 * Some(list) only inside an {@link withAllowedVexlOperations} region opened
 * by destination activation code. The gate consults it exclusively in
 * 'destinationActivating' mode.
 */
export const allowedVexlOperationsFiberRef = globalValue(
  Symbol.for('@vexl-next/mobile/api/allowedVexlOperationsFiberRef'),
  () =>
    FiberRef.unsafeMake<Option.Option<readonly AllowedVexlOperationId[]>>(
      Option.none()
    )
)

/**
 * Marks every Vexl request made inside `self` as belonging to the given
 * allowlisted destination-activation operations. Only effective while the
 * control mode is 'destinationActivating' — in every other migration mode
 * requests stay blocked regardless.
 */
export const withAllowedVexlOperations =
  (operations: Array.NonEmptyReadonlyArray<AllowedVexlOperationId>) =>
  <A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(self, allowedVexlOperationsFiberRef, Option.some(operations))

// The HttpClient.HttpClient service is typed to fail only with
// HttpClientError, so the gate failure is a RequestError whose `cause` is the
// typed VexlEgressBlockedError. Use isVexlEgressBlockedError to detect it.
const egressBlockedFailure = (
  request: HttpClientRequest.HttpClientRequest
): Effect.Effect<never, HttpClientError.RequestError> =>
  Effect.fail(
    new HttpClientError.RequestError({
      request,
      reason: 'Transport',
      cause: new VexlEgressBlockedError(),
      description: 'Vexl egress blocked by the device migration gate',
    })
  )

export const isVexlEgressBlockedError = (u: unknown): boolean =>
  u instanceof VexlEgressBlockedError ||
  (u instanceof HttpClientError.RequestError &&
    u.cause instanceof VexlEgressBlockedError)

const trackInFlight = <E, R>(
  effect: Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>,
  request: HttpClientRequest.HttpClientRequest
): Effect.Effect<
  HttpClientResponse.HttpClientResponse,
  E | HttpClientError.RequestError,
  R
> =>
  Effect.acquireUseRelease(
    // acquire is uninterruptible and release runs on EVERY exit — success,
    // typed failure, defect (getUserSessionCredentials throws on an
    // unsettled session) and interruption — so the count can never leak.
    Effect.sync(() => {
      gateState.activeRequestCount += 1
      // Capture the deferred that is current when this request starts;
      // reopenVexlRequests replaces it for later requests.
      return gateState.closeDeferred
    }),
    (closeDeferred) =>
      Effect.raceFirst(
        effect,
        Deferred.await(closeDeferred).pipe(
          Effect.zipRight(egressBlockedFailure(request))
        )
      ),
    () =>
      Effect.sync(() => {
        gateState.activeRequestCount -= 1
      })
  )

const gateVexlEgress = (client: HttpClient.HttpClient): HttpClient.HttpClient =>
  HttpClient.transform(client, (effect, request) =>
    Effect.suspend(() => {
      if (gateState.manuallyBlocked) return egressBlockedFailure(request)

      // Read per request, never per client: clients are cached (apiAtom runs
      // once per dependency change) while the mode changes at runtime.
      const mode = readMigrationControlRecord().mode

      if (mode === 'normal') return trackInFlight(effect, request)

      if (mode === 'destinationActivating')
        return FiberRef.get(allowedVexlOperationsFiberRef).pipe(
          Effect.flatMap((allowedOperations) =>
            Option.isSome(allowedOperations) &&
            Array.isNonEmptyReadonlyArray(allowedOperations.value)
              ? trackInFlight(effect, request)
              : egressBlockedFailure(request)
          )
        )

      // Every other migration mode (and the corrupt-record quarantine) denies
      // all Vexl egress.
      return egressBlockedFailure(request)
    })
  )

/**
 * Drop-in replacement for `FetchHttpClient.layer` with the device-migration
 * egress gate on top. Synchronously constructible (apiAtom builds it with
 * `Effect.runSync`).
 */
export const vexlGatedHttpClientLayer: Layer.Layer<HttpClient.HttpClient> =
  Layer.effect(
    HttpClient.HttpClient,
    Effect.map(HttpClient.HttpClient, gateVexlEgress)
  ).pipe(Layer.provide(FetchHttpClient.layer))

const DRAIN_POLL_INTERVAL_MS = 25

const awaitNoActiveVexlRequests: Effect.Effect<void> = Effect.suspend(() =>
  gateState.activeRequestCount <= 0
    ? Effect.void
    : Effect.zipRight(
        Effect.sleep(Duration.millis(DRAIN_POLL_INTERVAL_MS)),
        awaitNoActiveVexlRequests
      )
)

/**
 * Source-quiescence drain (spec section "In-flight request drain"):
 *
 * 1. blocks every new Vexl request (module flag, independent of the control
 *    mode — quiescing persists the mode first anyway);
 * 2. completes the gate-closing signal so interruptible in-flight requests
 *    are cancelled;
 * 3. waits until the active request count reaches zero, failing with
 *    {@link DrainTimeoutError} after `timeoutMs`.
 *
 * On failure the gate stays closed; the caller decides whether to restore
 * normal operation via {@link reopenVexlRequests}.
 */
export const drainAndBlockVexlRequests = (
  timeoutMs: number
): Effect.Effect<void, DrainTimeoutError> =>
  Effect.gen(function* () {
    gateState.manuallyBlocked = true
    yield* Deferred.succeed(gateState.closeDeferred, undefined)
    yield* awaitNoActiveVexlRequests.pipe(
      Effect.timeoutFail({
        duration: Duration.millis(timeoutMs),
        onTimeout: () => new DrainTimeoutError(),
      })
    )
  })

/**
 * Restores normal gate operation after a failed quiescence attempt: lifts
 * the manual block and arms a fresh gate-closing signal for future drains.
 * (Requests are still subject to the control-mode check.)
 */
export const reopenVexlRequests = (): void => {
  gateState.manuallyBlocked = false
  gateState.closeDeferred = Deferred.unsafeMake<undefined>(FiberId.none)
}

export const getActiveVexlRequestCount = (): number =>
  gateState.activeRequestCount
