import {Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {Alert, Linking} from 'react-native'
import {sessionHolderAtom} from '.'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../utils/reportError'
import {SECRET_TOKEN_KEY, SESSION_KEY} from './sessionKeys'
import readSessionFromStorage from './utils/readSessionFromStorage'

function logLoadSessionProgress(text: string): void {
  void showDebugNotificationIfEnabled({
    title: 'Load session',
    subtitle: 'loadSessionProgress',
    body: text,
  })
}

export function loadSession(
  {
    showErrorAlert,
    forceReload,
  }: {showErrorAlert: boolean; forceReload: boolean} = {
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

    if (
      !(
        sessionState === 'initial' ||
        (forceReload && sessionState !== 'loading')
      )
    ) {
      logLoadSessionProgress(
        `Skippign loadSession. Result: ${sessionState === 'loggedIn'}`
      )
      return sessionState === 'loggedIn'
    }

    console.info('🔑Trying to find session in storage')
    getDefaultStore().set(sessionHolderAtom, {state: 'loading'})

    const session = yield* _(
      readSessionFromStorage({
        asyncStorageKey: SESSION_KEY,
        secretStorageKey: SECRET_TOKEN_KEY,
      })
    )
    logLoadSessionProgress('🔑 We have a session 🎉. User is logged in.')
    getDefaultStore().set(sessionHolderAtom, {
      state: 'loggedIn',
      session,
    })
    return true
  }).pipe(
    Effect.catchAll((error) => {
      logLoadSessionProgress(
        `Error while loading session ${JSON.stringify(error)}`
      )

      if (error._tag === 'StoreEmpty') {
        console.info('🔑 No session in storage. User is logged out')
        getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
        return Effect.succeed(false)
      }

      reportError(
        'error',
        new Error(
          '‼️ Error while reading or parsing user data from secure storage.'
        ),
        {error}
      )

      if (showErrorAlert) {
        const {t} = getDefaultStore().get(translationAtom)
        Alert.alert(
          t('errorGettingSession.title'),
          t('errorGettingSession.text', {errorCode: error._tag}),
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

      return Effect.succeed(false)
    })
  )
}
