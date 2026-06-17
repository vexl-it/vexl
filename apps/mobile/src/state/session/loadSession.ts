import {FetchHttpClient} from '@effect/platform/index'
import {contact, offer} from '@vexl-next/rest-api'
import {Data, Effect, Option} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {Alert, Linking} from 'react-native'
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
import reportError, {reportErrorE} from '../../utils/reportError'
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

function logLoadSessionProgress(text: string): void {
  console.log('🔑 loading session', text)
  void showDebugNotificationIfEnabled({
    title: 'Load session',
    subtitle: 'loadSessionProgress',
    body: text,
  })
}

let resolveSessionLoaded: () => void = () => {}
const sessionLoadedPromise = new Promise<void>(
  (resolve) => (resolveSessionLoaded = resolve)
)

type SessionState = 'initial' | 'loading' | 'loggedOut' | 'loggedIn'
export type SessionStorageError = Effect.Effect.Error<
  ReturnType<typeof readSessionFromStorage>
>

export type LoadSessionResult =
  | {
      readonly sessionLoaded: true
    }
  | {
      readonly sessionLoaded: false
      readonly loadingError?: SessionStorageError
      readonly blockingRecoveryRequired: boolean
    }

interface LoadSessionOptions {
  readonly showErrorAlert: boolean
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
  loadingError: Option.Option<SessionStorageError> = Option.none()
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

function shouldWaitForLoadingToFinish(
  sessionState: SessionState,
  forceReload: boolean
): boolean {
  return sessionState === 'loading' && !forceReload
}

function shouldSkipLoading(
  sessionState: SessionState,
  forceReload: boolean
): boolean {
  const canStartLoad =
    sessionState === 'initial' || (forceReload && sessionState !== 'loading')

  return !canStartLoad
}

function isBlockingRecoveryError(loadingError: SessionStorageError): boolean {
  return (
    loadingError._tag === 'StoredSessionSecretUnavailable' ||
    loadingError._tag === 'ErrorReadingFromSecureStorage' ||
    loadingError._tag === 'V2SecretReadFailedAfterBeingWritten' ||
    loadingError._tag === 'CryptoError' ||
    loadingError._tag === 'ParseError'
  )
}

function handleSessionStorageError(
  loadingError: SessionStorageError,
  showErrorAlert: boolean
): void {
  if (loadingError._tag === 'StoreEmpty') {
    logLoadSessionProgress('No session in storage. User is logged out')
    getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
    return
  }

  if (loadingError._tag === 'V2SecretReadFailedAfterBeingWritten') {
    reportError(
      'error',
      new Error(
        '‼️ V2 session secret was previously written but could not be read from secure storage.'
      ),
      {loadingError}
    )
  }
  getDefaultStore().set(
    clearPersistentDataAboutReachAndImportedContactsActionAtom
  )

  if (showErrorAlert) {
    const {t} = getDefaultStore().get(translationAtom)
    Alert.alert(
      t('errorGettingSession.title'),
      t('errorGettingSession.text', {errorCode: loadingError._tag}),
      [
        {
          text: t('errorGettingSession.contactSupport'),
          onPress: () => {
            void Linking.openURL(`mailto:${t('settings.items.supportEmail')}`)
          },
        },
      ]
    )
    return
  }

  getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
}

function readSessionFromStorageHandleErrors(
  showErrorAlert: boolean
): Effect.Effect<ReadSessionFromStorageResult> {
  return readSessionFromStorage({
    asyncStorageKey: SESSION_KEY,
    secretStorageKey: SECRET_TOKEN_KEY,
    secretStorageKeyV2: SECRET_TOKEN_KEY_V2,
  }).pipe(
    Effect.map(readSessionFromStorageSuccess),
    Effect.catchAll((e) =>
      Effect.sync(() => {
        logLoadSessionProgress(
          `Error while loading session ${JSON.stringify(e)}`
        )
        handleSessionStorageError(e, showErrorAlert)
        return readSessionFromStorageFailure(e)
      })
    )
  )
}

const waitForLoadingSessionFinished = (
  timeoutMillis: number = 5_000
): Effect.Effect<boolean> => {
  return Effect.promise(async () => {
    await sessionLoadedPromise
  }).pipe(
    Effect.zipRight(Effect.succeed(true)),
    Effect.timeout(timeoutMillis),
    Effect.catchTag('TimeoutException', (e) =>
      Effect.zipRight(
        reportErrorE(
          'error',
          new Error('Waiting for sessionfinished timeout', {cause: e})
        ),
        Effect.succeed(false)
      )
    )
  )
}

function waitForAlreadyLoadingSessionResult(): Effect.Effect<LoadSessionResult> {
  return Effect.gen(function* () {
    logLoadSessionProgress('Session is already loading. Waiting for result')

    yield* waitForLoadingSessionFinished()

    const sessionStateCurrent = getDefaultStore().get(sessionHolderAtom).state

    logLoadSessionProgress(
      `Loading finished after callback. Result: ${sessionStateCurrent}`
    )

    return sessionStateCurrent === 'loggedIn'
      ? sessionLoadedResult()
      : sessionNotLoadedResult()
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
export function loadSession(
  {showErrorAlert, forceReload}: LoadSessionOptions = {
    showErrorAlert: false,
    forceReload: false,
  }
): Effect.Effect<LoadSessionResult> {
  return Effect.gen(function* (_) {
    const store = getDefaultStore()
    const sessionState = store.get(sessionHolderAtom).state

    logLoadSessionProgress(
      `LoadingSession: ${JSON.stringify({
        showErrorAlert,
        forceReload,
        sessionState,
      })}`
    )

    if (shouldWaitForLoadingToFinish(sessionState, forceReload)) {
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

    logLoadSessionProgress('Trying to find session in storage')
    store.set(sessionHolderAtom, {state: 'loading'})

    const readSessionResult = yield* _(
      readSessionFromStorageHandleErrors(showErrorAlert)
    )

    if (Option.isNone(readSessionResult.sessionFromStorage)) {
      // We don't have a session. User is logged out.
      getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
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

    resolveSessionLoaded()

    return sessionLoadedResult()
  }).pipe(
    Effect.catchAll((e) =>
      Effect.zipRight(
        reportErrorE(
          'error',
          new Error('Unexpected error while loading session', {cause: e}),
          {
            error: e,
          }
        ),
        Effect.sync(() => {
          getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
          return sessionNotLoadedResult()
        })
      )
    )
  )
}
