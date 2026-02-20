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
import {upgradeSession, type UpgradeSessionError} from './upgradeSession'
import {migrateClubsToV2Keys} from './utils/migrateClubsToV2Keys'
import {migrateOwnerPrivatePartsToV2Keys} from './utils/migrateOwnerPrivatePartsToV2Keys'
import {readSessionFromStorage} from './utils/readSessionFromStorage'
import writeSessionToStorage, {
  SECRET_TOKEN_KEY,
  SESSION_KEY,
  type SessionWriteError,
} from './utils/writeSessionToStorage'

export class SessionSanityCheckFailed extends Data.TaggedError(
  'SessionSanityCheckFailed'
)<{cause: unknown; message: string; session: SessionV2}> {}

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
type SessionStorageError = Effect.Effect.Error<
  ReturnType<typeof readSessionFromStorage>
>

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

function handleSessionStorageError(
  loadingError: SessionStorageError,
  showErrorAlert: boolean
): void {
  if (loadingError._tag === 'StoreEmpty') {
    logLoadSessionProgress('No session in storage. User is logged out')
    getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
    return
  }

  reportError(
    'error',
    new Error(
      '‼️ Error while reading or parsing user data from secure storage.'
    ),
    {loadingError}
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
): Effect.Effect<Option.Option<Session>> {
  return readSessionFromStorage({
    asyncStorageKey: SESSION_KEY,
    secretStorageKey: SECRET_TOKEN_KEY,
  }).pipe(
    Effect.tapError((e) =>
      Effect.sync(() => {
        logLoadSessionProgress(
          `Error while loading session ${JSON.stringify(e)}`
        )
        handleSessionStorageError(e, showErrorAlert)
      })
    ),
    Effect.option
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

function waitForAlreadyLoadingSessionResult(): Effect.Effect<boolean> {
  return Effect.gen(function* () {
    logLoadSessionProgress('Session is already loading. Waiting for result')

    yield* waitForLoadingSessionFinished()

    const sessionStateCurrent = getDefaultStore().get(sessionHolderAtom).state

    logLoadSessionProgress(
      `Loading finished after callback. Result: ${sessionStateCurrent}`
    )

    return sessionStateCurrent === 'loggedIn'
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
            session.sessionNotificationToken
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
  {
    showErrorAlert,
    forceReload,
  }: {
    showErrorAlert: boolean
    forceReload: boolean
  } = {
    showErrorAlert: false,
    forceReload: false,
  }
): Effect.Effect<boolean> {
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
    }

    logLoadSessionProgress('Trying to find session in storage')
    store.set(sessionHolderAtom, {state: 'loading'})

    const sessionFromStorage = yield* _(
      readSessionFromStorageHandleErrors(showErrorAlert)
    )

    if (Option.isNone(sessionFromStorage)) {
      // We don't have a session. User is logged out.
      getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
      return false
    }

    const session = yield* ensureV2SessionIfNotCreateAndWrite(
      sessionFromStorage.value
    )

    if (!sanityCheckSessionV2(session)) {
      logLoadSessionProgress('Sanity check of loaded session failed')
      return yield* _(
        Effect.fail(
          new SessionSanityCheckFailed({
            message: 'Session sanity check failed',
            cause: 'Session data is invalid or corrupted',
            session,
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

    return true
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
          return false
        })
      )
    )
  )
}
