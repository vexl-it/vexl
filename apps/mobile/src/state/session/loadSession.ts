import {FetchHttpClient} from '@effect/platform/index'
import {contact, offer} from '@vexl-next/rest-api'
import {Data, Effect, Option, Schema} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {sessionHolderAtom} from '.'
import {apiEnv} from '../../api'
import {
  isSessionV1,
  sanityCheckSessionV2,
  type Session,
  type SessionV2,
} from '../../brands/Session.brand'
import {
  appSource,
  deviceModel,
  osVersion,
  platform,
  version,
  versionCode,
} from '../../utils/environment'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {isDeveloperAtom} from '../../utils/preferences'
import {reportErrorE} from '../../utils/reportError'
import {clearPersistentDataAboutReachAndImportedContactsActionAtom} from '../connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import {upgradeSession, type UpgradeSessionError} from './upgradeSession'
import {migrateClubsToV2Keys} from './utils/migrateClubsToV2Keys'
import {migrateOwnerPrivatePartsToV2Keys} from './utils/migrateOwnerPrivatePartsToV2Keys'
import {readSessionFromStorage} from './utils/readSessionFromStorage'
import writeSessionToStorage, {
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
  SESSION_KEY,
  type SessionWriteError,
} from './utils/writeSessionToStorage'

export class SessionSanityCheckFailed extends Data.TaggedError(
  'SessionSanityCheckFailed'
)<{cause: unknown; message: string}> {}

export class SessionLoadWaitTimedOut extends Schema.TaggedError<SessionLoadWaitTimedOut>(
  'SessionLoadWaitTimedOut'
)('SessionLoadWaitTimedOut', {
  cause: Schema.Unknown,
}) {}

const ErrorWithTag = Schema.Struct({_tag: Schema.String})

function safeErrorTag(e: unknown): string {
  return Schema.is(ErrorWithTag)(e) ? e._tag : 'unknown'
}

function logLoadSessionProgress(text: string): void {
  console.log('🔑 loading session', text)
  void showDebugNotificationIfEnabled({
    title: 'Load session',
    subtitle: 'loadSessionProgress',
    body: text,
  })
}

// Tracks the single in-flight storage load, or null when none is running. A
// fresh promise is created for each real load (beginInFlightLoad) and resolved
// only when THAT load settles (settleInFlightLoad). Callers that arrive while a
// load is running await this exact promise, so they wake when the real load
// finishes - never on an unrelated no-op/skip call.
//
// This replaces a module-level one-shot promise that was created once and
// resolved by whichever loadSession call finished first - including a no-op skip
// - which woke parked waiters while the real read was still in flight, and then
// stayed resolved forever so it never blocked again on later load cycles.
interface InFlightLoad {
  readonly promise: Promise<LoadSessionResult>
  readonly settle: (result: LoadSessionResult) => void
}

let inFlightLoad: InFlightLoad | null = null

function beginInFlightLoad(): InFlightLoad {
  let settle: (result: LoadSessionResult) => void = () => {}
  const promise = new Promise<LoadSessionResult>((resolve) => {
    settle = resolve
  })
  const handle = {promise, settle}
  inFlightLoad = handle
  return handle
}

function settleInFlightLoad(
  handle: InFlightLoad,
  result: LoadSessionResult
): void {
  handle.settle(result)
  if (inFlightLoad === handle) {
    inFlightLoad = null
  }
}

type SessionState = 'initial' | 'loading' | 'loggedOut' | 'loggedIn'
export type SessionStorageError = Effect.Effect.Error<
  ReturnType<typeof readSessionFromStorage>
>
export type LoadSessionError = SessionStorageError | SessionLoadWaitTimedOut

export type LoadSessionResult =
  | {
      readonly sessionLoaded: true
    }
  | {
      readonly sessionLoaded: false
      readonly loadingError?: LoadSessionError
      readonly blockingRecoveryRequired: boolean
    }

interface LoadSessionOptions {
  readonly forceReload: boolean
}

interface ReadSessionFromStorageResult {
  readonly sessionFromStorage: Option.Option<Session>
  readonly loadingError: Option.Option<SessionStorageError>
}

function sessionLoadedResult(): LoadSessionResult {
  return {sessionLoaded: true}
}

function sessionNotLoadedResult(
  loadingError: Option.Option<LoadSessionError> = Option.none()
): LoadSessionResult {
  if (Option.isSome(loadingError)) {
    return {
      sessionLoaded: false,
      loadingError: loadingError.value,
      blockingRecoveryRequired: isBlockingRecoveryError(loadingError.value),
    }
  }

  return {sessionLoaded: false, blockingRecoveryRequired: false}
}

function sessionBlockingRecoveryResult(): LoadSessionResult {
  return {sessionLoaded: false, blockingRecoveryRequired: true}
}

function resultFromCurrentSessionState(): LoadSessionResult {
  return getDefaultStore().get(sessionHolderAtom).state === 'loggedIn'
    ? sessionLoadedResult()
    : sessionNotLoadedResult()
}

function readSessionFromStorageSuccess(
  sessionFromStorage: Session
): ReadSessionFromStorageResult {
  return {
    sessionFromStorage: Option.some(sessionFromStorage),
    loadingError: Option.none(),
  }
}

function readSessionFromStorageFailure(
  loadingError: SessionStorageError
): ReadSessionFromStorageResult {
  return {
    sessionFromStorage: Option.none(),
    loadingError: Option.some(loadingError),
  }
}

function shouldWaitForLoadingToFinish(sessionState: SessionState): boolean {
  // Any caller arriving while a load is in flight waits for it - including
  // forceReload callers. A load that is already running is, by definition,
  // reading fresh data from storage, which is exactly what forceReload wants.
  // Starting a second concurrent read instead would race the in-flight one
  // (duplicate V2-secret backfill / session-upgrade writes) and risk corruption.
  return sessionState === 'loading'
}

function shouldSkipLoading(
  sessionState: SessionState,
  forceReload: boolean
): boolean {
  const canStartLoad =
    sessionState === 'initial' || (forceReload && sessionState !== 'loading')

  return !canStartLoad
}

const BLOCKING_RECOVERY_ERROR_TAGS = new Set<string>([
  'StoredSessionSecretUnavailable',
  'ErrorReadingFromSecureStorage',
  'ErrorReadingFromAsyncStorage',
  // ErrorWritingToStore is never surfaced by readSessionFromStorage today (V2
  // backfill writes are best-effort), but treat any storage write failure as
  // blocking so a transient failure never silently routes to LoginFlow.
  'ErrorWritingToStore',
  'V2SecretReadFailedAfterBeingWritten',
  // CryptoError / ParseError are deliberately blocking: never auto-logout on
  // possibly-misclassified corruption.
  'CryptoError',
  'ParseError',
  'SessionLoadWaitTimedOut',
])

function isBlockingRecoveryError(loadingError: LoadSessionError): boolean {
  // StoreEmpty is intentionally NOT blocking: genuinely logged-out users must
  // still reach the login flow.
  return BLOCKING_RECOVERY_ERROR_TAGS.has(loadingError._tag)
}

function sessionLoadWaitTimedOut(cause: unknown): SessionLoadWaitTimedOut {
  return new SessionLoadWaitTimedOut({cause})
}

function readSessionFromStorageHandleErrors(): Effect.Effect<ReadSessionFromStorageResult> {
  return readSessionFromStorage({
    asyncStorageKey: SESSION_KEY,
    secretStorageKey: SECRET_TOKEN_KEY,
    secretStorageKeyV2: SECRET_TOKEN_KEY_V2,
  }).pipe(
    Effect.map(readSessionFromStorageSuccess),
    Effect.catchAll((e) =>
      Effect.sync(() => {
        // We are deliberately logging this. The notification logging is disabled
        // by default so this does not pose risk of leaking user data
        logLoadSessionProgress(
          `Error while loading session. tag: ${safeErrorTag(e)}`
        )
        return readSessionFromStorageFailure(e)
      })
    )
  )
}

function waitForLoadingSessionFinished(
  loadToWaitFor: InFlightLoad | null,
  timeoutMillis: number = 5_000
): Effect.Effect<LoadSessionResult> {
  if (loadToWaitFor === null) return Effect.sync(resultFromCurrentSessionState)

  return Effect.promise(() => loadToWaitFor.promise).pipe(
    Effect.timeout(timeoutMillis),
    Effect.catchTag('TimeoutException', (e) =>
      Effect.zipRight(
        reportErrorE(
          'warn',
          new Error('Waiting for session load to finish timed out', {cause: e})
        ),
        Effect.succeed(
          sessionNotLoadedResult(Option.some(sessionLoadWaitTimedOut(e)))
        )
      )
    )
  )
}

function waitForAlreadyLoadingSessionResult(): Effect.Effect<LoadSessionResult> {
  return Effect.gen(function* () {
    logLoadSessionProgress('Session is already loading. Waiting for result')

    const loadSessionResult = yield* waitForLoadingSessionFinished(inFlightLoad)

    const sessionStateCurrent = getDefaultStore().get(sessionHolderAtom).state

    logLoadSessionProgress(
      `Loading finished after callback. Result: ${sessionStateCurrent}`
    )

    return loadSessionResult
  })
}

const ensureV2SessionIfNotCreateAndWrite = (
  session: Session
): Effect.Effect<SessionV2, UpgradeSessionError | SessionWriteError, never> =>
  Effect.gen(function* (_) {
    if (isSessionV1(session)) {
      const upgradedSession = yield* upgradeSession(session)
      yield* writeSessionToStorage(upgradedSession)
      const store = getDefaultStore()

      const contactApi = yield* contact
        .api({
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          url: apiEnv.contactMs,
          getUserSessionCredentials: () => upgradedSession.sessionCredentials,
          appSource,
          language: store.get(translationAtom).t('localeName'),
          isDeveloper: store.get(isDeveloperAtom),
          deviceModel,
          osVersion,
        })
        .pipe(Effect.provide(FetchHttpClient.layer))

      const offerApi = yield* offer
        .api({
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          url: apiEnv.offerMs,
          getUserSessionCredentials: () => upgradedSession.sessionCredentials,
          appSource,
          language: store.get(translationAtom).t('localeName'),
          isDeveloper: store.get(isDeveloperAtom),
          deviceModel,
          osVersion,
        })
        .pipe(Effect.provide(FetchHttpClient.layer))

      yield* contactApi
        .refreshUser({
          vexlNotificationToken: Option.fromNullable(
            upgradedSession.sessionNotificationToken
          ),
          offersAlive: true,
        })
        .pipe(
          Effect.tapError((e) => reportErrorE('error', e)),
          Effect.ignore
        )

      yield* migrateClubsToV2Keys(upgradedSession, contactApi)

      yield* migrateOwnerPrivatePartsToV2Keys({
        session: upgradedSession,
        offerApi,
      })

      return upgradedSession
    }

    return session
  })
function performSessionLoad(): Effect.Effect<LoadSessionResult> {
  let inFlightLoadHandle: InFlightLoad | null = null

  return Effect.gen(function* (_) {
    const store = getDefaultStore()

    logLoadSessionProgress('Trying to find session in storage')
    // Arm the in-flight latch before flipping to 'loading' so any caller that
    // observes 'loading' is guaranteed to also observe inFlightLoad set.
    inFlightLoadHandle = beginInFlightLoad()
    store.set(sessionHolderAtom, {state: 'loading'})

    const readSessionResult = yield* _(readSessionFromStorageHandleErrors())

    if (Option.isNone(readSessionResult.sessionFromStorage)) {
      // We don't have a session. User is logged out.
      // NOTE: data is NOT erased here - this only flips the in-memory atom.
      getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})

      // If the session became unreadable due to a storage error (not a clean
      // empty store), reset the cached reach / imported-contacts baseline so a
      // stale value can't trigger a false "drop in reach detected" dialog.
      if (
        Option.isSome(readSessionResult.loadingError) &&
        readSessionResult.loadingError.value._tag !== 'StoreEmpty'
      ) {
        getDefaultStore().set(
          clearPersistentDataAboutReachAndImportedContactsActionAtom
        )
      }

      return sessionNotLoadedResult(readSessionResult.loadingError)
    }

    const session = yield* ensureV2SessionIfNotCreateAndWrite(
      readSessionResult.sessionFromStorage.value
    )

    if (!sanityCheckSessionV2(session)) {
      logLoadSessionProgress('Sanity check of loaded session failed')
      return yield* _(
        Effect.fail(
          new SessionSanityCheckFailed({
            message: 'Session sanity check failed',
            cause: 'Session data is invalid or corrupted',
          })
        )
      )
    }

    logLoadSessionProgress('🎉 Session ready. User is logged in.')

    store.set(sessionHolderAtom, {
      state: 'loggedIn',
      session,
    })

    return sessionLoadedResult()
  }).pipe(
    Effect.catchAll((e) =>
      Effect.zipRight(
        reportErrorE(
          'error',
          new Error(
            `Unexpected error while loading session. tag: ${safeErrorTag(e)}`
          )
        ),
        Effect.sync(() => {
          getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
          return sessionBlockingRecoveryResult()
        })
      )
    ),
    Effect.tap((loadSessionResult) =>
      Effect.sync(() => {
        if (inFlightLoadHandle !== null) {
          settleInFlightLoad(inFlightLoadHandle, loadSessionResult)
        }
      })
    ),
    // Settle only after the state has been resolved (loggedIn / loggedOut /
    // initial) by the body or the catchAll above, so a parked waiter that wakes
    // here never observes a stale 'loading'. Runs on success, failure and
    // interruption.
    Effect.ensuring(
      Effect.sync(() => {
        if (
          inFlightLoadHandle !== null &&
          inFlightLoad === inFlightLoadHandle
        ) {
          settleInFlightLoad(
            inFlightLoadHandle,
            resultFromCurrentSessionState()
          )
        }
      })
    )
  )
}

export function loadSession(
  {forceReload}: LoadSessionOptions = {
    forceReload: false,
  }
): Effect.Effect<LoadSessionResult> {
  return Effect.gen(function* (_) {
    const store = getDefaultStore()
    const sessionState = store.get(sessionHolderAtom).state

    logLoadSessionProgress(
      `LoadingSession: ${JSON.stringify({
        forceReload,
        sessionState,
      })}`
    )

    if (shouldWaitForLoadingToFinish(sessionState)) {
      return yield* _(waitForAlreadyLoadingSessionResult())
    }

    if (shouldSkipLoading(sessionState, forceReload)) {
      logLoadSessionProgress(
        `Skipping loadSession. Result: ${sessionState === 'loggedIn'}`
      )
      return store.get(sessionHolderAtom).state === 'loggedIn'
        ? sessionLoadedResult()
        : sessionNotLoadedResult()
    }

    return yield* _(performSessionLoad())
  })
}
