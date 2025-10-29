import {Effect, Either} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {Alert, Linking} from 'react-native'
import {sessionHolderAtom} from '.'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import reportError, {reportErrorE} from '../../utils/reportError'
import {SECRET_TOKEN_KEY, SESSION_KEY} from './sessionKeys'
import {readSessionFromStorageE} from './utils/readSessionFromStorage'

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
      })})}`
    )

    // Session is loading and we don't want to force reload.
    // In this case just wait until loading is finished
    if (sessionState === 'loading' && !forceReload) {
      logLoadSessionProgress(
        `Session is already loading. Result: ${sessionState}`
      )
      yield* _(waitForLoadingSessionFinished())
      const sessionStateCurrent = store.get(sessionHolderAtom).state
      logLoadSessionProgress(
        `Loading finished after callback. Result: ${sessionStateCurrent}`
      )
      return sessionStateCurrent === 'loggedIn'
    }

    if (
      !(
        sessionState === 'initial' ||
        (forceReload && sessionState !== 'loading')
      )
    ) {
      logLoadSessionProgress(
        `Skipping loadSession. Result: ${sessionState === 'loggedIn'}`
      )

      return store.get(sessionHolderAtom).state === 'loggedIn'
    }

    logLoadSessionProgress('Trying to find session in storage')
    getDefaultStore().set(sessionHolderAtom, {state: 'loading'})

    const sessionFromStorageE = yield* _(
      readSessionFromStorageE({
        asyncStorageKey: SESSION_KEY,
        secretStorageKey: SECRET_TOKEN_KEY,
      }),
      Effect.either
    )

    if (Either.isLeft(sessionFromStorageE)) {
      const loadingError = sessionFromStorageE.left
      logLoadSessionProgress(
        `Error while loading session ${JSON.stringify(loadingError)}`
      )

      if (loadingError._tag === 'StoreEmpty') {
        logLoadSessionProgress('No session in storage. User is logged out')
        getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
        return false
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
                void Linking.openURL(
                  `mailto:${t('settings.items.supportEmail')}`
                )
              },
            },
          ]
        )
      } else {
        getDefaultStore().set(sessionHolderAtom, {state: 'initial'})
      }

      return false
    }

    const session = sessionFromStorageE.right

    logLoadSessionProgress('🎉 We have a session. User is logged in.')
    getDefaultStore().set(sessionHolderAtom, {
      state: 'loggedIn',
      session,
    })

    resolveSessionLoaded()

    return true
  })
}
