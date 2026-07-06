import {FetchHttpClient} from '@effect/platform/index'
import {contact, offer} from '@vexl-next/rest-api'
import {Cause, Data, Effect, Either, Option, Schema} from 'effect/index'
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

// The promise of the currently running storage load is the SINGLE source of
// truth for "a load is in flight". It is published synchronously when a load
// starts and cleared when it settles - which is guaranteed to happen: the
// published promise is the load raced against a watchdog timer, so even a
// load hung on a dead native storage call settles (as abandoned) and frees
// the slot for a fresh load. It is therefore non-null exactly while a live
// (non-abandoned) load runs. The 'loading' value in sessionHolderAtom is UI
// state derived from it and is never used for concurrency decisions -
// keeping those two in sync by hand is what caused race conditions here in
// the past.
let inFlightLoad: Promise<LoadSessionResult> | null = null

const JOIN_IN_FLIGHT_LOAD_TIMEOUT_MILLIS = 5_000

// Upper bound on how long a single load may stay in flight. Generous enough
// for a slow v1 -> v2 session upgrade (which makes network calls), but
// finite so a load hung on a dead native storage bridge cannot hold the
// in-flight slot forever - without it the only recovery is an app restart.
const SESSION_LOAD_WATCHDOG_TIMEOUT_MILLIS = 30_000

function sessionLoadedResult(): LoadSessionResult {
  return {sessionLoaded: true}
}

function sessionNotLoadedResult(
  loadingError?: LoadSessionError
): LoadSessionResult {
  if (loadingError === undefined)
    return {sessionLoaded: false, blockingRecoveryRequired: false}

  return {
    sessionLoaded: false,
    loadingError,
    blockingRecoveryRequired: isBlockingRecoveryError(loadingError),
  }
}

function sessionBlockingRecoveryResult(): LoadSessionResult {
  return {sessionLoaded: false, blockingRecoveryRequired: true}
}

function resultFromCurrentSessionState(): LoadSessionResult {
  return getDefaultStore().get(sessionHolderAtom).state === 'loggedIn'
    ? sessionLoadedResult()
    : sessionNotLoadedResult()
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

function joinInFlightLoad(
  loadPromise: Promise<LoadSessionResult>
): Effect.Effect<LoadSessionResult> {
  return Effect.gen(function* () {
    logLoadSessionProgress('Session is already loading. Waiting for result')

    const loadSessionResult = yield* Effect.promise(() => loadPromise).pipe(
      Effect.timeout(JOIN_IN_FLIGHT_LOAD_TIMEOUT_MILLIS),
      Effect.catchTag('TimeoutException', (e) =>
        Effect.zipRight(
          reportErrorE(
            'warn',
            new Error('Waiting for session load to finish timed out', {
              cause: e,
            })
          ),
          Effect.succeed(
            sessionNotLoadedResult(new SessionLoadWaitTimedOut({cause: e}))
          )
        )
      )
    )

    logLoadSessionProgress(
      `Loading finished after callback. Result: ${
        getDefaultStore().get(sessionHolderAtom).state
      }`
    )

    return loadSessionResult
  })
}

const ensureV2SessionIfNotCreateAndWrite = (
  session: Session
): Effect.Effect<SessionV2, UpgradeSessionError | SessionWriteError, never> =>
  Effect.gen(function* () {
    if (!isSessionV1(session)) return session

    const upgradedSession = yield* upgradeSession(session)
    yield* writeSessionToStorage(upgradedSession)

    const store = getDefaultStore()
    const commonApiArgs = {
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      getUserSessionCredentials: () => upgradedSession.sessionCredentials,
      appSource,
      language: store.get(translationAtom).t('localeName'),
      isDeveloper: store.get(isDeveloperAtom),
      deviceModel,
      osVersion,
    }

    const contactApi = yield* contact
      .api({...commonApiArgs, url: apiEnv.contactMs})
      .pipe(Effect.provide(FetchHttpClient.layer))

    const offerApi = yield* offer
      .api({...commonApiArgs, url: apiEnv.offerMs})
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
  })

function performSessionLoad(): Effect.Effect<LoadSessionResult> {
  return Effect.gen(function* () {
    const store = getDefaultStore()

    logLoadSessionProgress('Trying to find session in storage')

    const readSessionResult = yield* readSessionFromStorage().pipe(
      Effect.tapError((e) =>
        Effect.sync(() => {
          logLoadSessionProgress(
            `Error while loading session. tag: ${safeErrorTag(e)}`
          )
        })
      ),
      Effect.either
    )

    if (Either.isLeft(readSessionResult)) {
      const loadingError = readSessionResult.left

      // We don't have a session. User is logged out.
      // NOTE: data is NOT erased here - this only flips the in-memory atom.
      store.set(sessionHolderAtom, {state: 'loggedOut'})

      // If the session became unreadable due to a storage error (not a clean
      // empty store), reset the cached reach / imported-contacts baseline so a
      // stale value can't trigger a false "drop in reach detected" dialog.
      if (loadingError._tag !== 'StoreEmpty') {
        store.set(clearPersistentDataAboutReachAndImportedContactsActionAtom)
      }

      return sessionNotLoadedResult(loadingError)
    }

    const session = yield* ensureV2SessionIfNotCreateAndWrite(
      readSessionResult.right
    )

    if (!sanityCheckSessionV2(session)) {
      logLoadSessionProgress('Sanity check of loaded session failed')
      return yield* Effect.fail(
        new SessionSanityCheckFailed({
          message: 'Session sanity check failed',
          cause: 'Session data is invalid or corrupted',
        })
      )
    }

    logLoadSessionProgress('🎉 Session ready. User is logged in.')

    store.set(sessionHolderAtom, {
      state: 'loggedIn',
      session,
    })

    return sessionLoadedResult()
  }).pipe(
    // catchAllCause (not catchAll) so even a defect finalizes the state and
    // yields a result: the atom can never be left stuck in 'loading' and the
    // in-flight promise always resolves for joined callers.
    Effect.catchAllCause((cause) =>
      Effect.zipRight(
        reportErrorE(
          'error',
          // Deliberately only the error tag - never the error itself, which
          // could carry session data.
          new Error(
            `Unexpected error while loading session. tag: ${safeErrorTag(
              Cause.squash(cause)
            )}`
          )
        ),
        Effect.sync(() => {
          getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
          return sessionBlockingRecoveryResult()
        })
      )
    )
  )
}

export function loadSession(
  {forceReload}: LoadSessionOptions = {
    forceReload: false,
  }
): Effect.Effect<LoadSessionResult> {
  return Effect.suspend(() => {
    const store = getDefaultStore()
    const sessionState = store.get(sessionHolderAtom).state

    logLoadSessionProgress(
      `LoadingSession: ${JSON.stringify({
        forceReload,
        sessionState,
      })}`
    )

    // Any caller arriving while a load is in flight joins it - including
    // forceReload callers. A load that is already running is, by definition,
    // reading fresh data from storage, which is exactly what forceReload
    // wants. Starting a second concurrent read instead would race the
    // in-flight one (duplicate V2-secret backfill / session-upgrade writes)
    // and risk corruption.
    const loadToJoin = inFlightLoad
    if (loadToJoin !== null) return joinInFlightLoad(loadToJoin)

    if (sessionState !== 'initial' && !forceReload) {
      logLoadSessionProgress(
        `Skipping loadSession. Result: ${sessionState === 'loggedIn'}`
      )
      return Effect.sync(resultFromCurrentSessionState)
    }

    // The load runs on its own root fiber: once started it always runs to
    // completion (and settles the session state) even if the caller that
    // started it is interrupted. The fiber suspends at its first storage
    // read, so publishing the promise and flipping the UI state below happen
    // before anything else can observe the load.
    const loadPromise = Effect.runPromise(performSessionLoad())

    // Watchdog: if storage hangs forever (e.g. a dead native bridge), the
    // load promise never settles. Racing it against a timer guarantees the
    // published promise always settles, so every caller - the initiator and
    // joiners alike - gets a result and the slot is always freed for a fresh
    // load. The abandoned load is deliberately NOT interrupted (interrupting
    // could tear a half-finished storage write): it keeps running in the
    // background, still settles the session atom if it ever finishes, and
    // the ownership check below keeps it from touching a newer load's slot.
    let watchdogTimer: ReturnType<typeof setTimeout> | undefined
    const watchdogPromise = new Promise<LoadSessionResult>((resolve) => {
      watchdogTimer = setTimeout(() => {
        void Effect.runPromise(
          reportErrorE(
            'warn',
            new Error(
              'Session load did not settle within the watchdog timeout. Abandoning it.'
            )
          )
        )
        const watchdogStore = getDefaultStore()
        if (watchdogStore.get(sessionHolderAtom).state === 'loading')
          watchdogStore.set(sessionHolderAtom, {state: 'initial'})
        resolve(
          sessionNotLoadedResult(
            new SessionLoadWaitTimedOut({cause: 'SessionLoadWatchdogTimedOut'})
          )
        )
      }, SESSION_LOAD_WATCHDOG_TIMEOUT_MILLIS)
    })

    const publishedLoad = Promise.race([loadPromise, watchdogPromise])
    inFlightLoad = publishedLoad
    store.set(sessionHolderAtom, {state: 'loading'})
    void publishedLoad.finally(() => {
      clearTimeout(watchdogTimer)
      // Only the load that owns the slot may free it.
      if (inFlightLoad === publishedLoad) inFlightLoad = null
    })

    return Effect.promise(() => publishedLoad)
  })
}
