import {effectToTask} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect/index'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
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

type Listener = () => void
type Unsubscribe = () => void
const loadingSessionFinishedListeners: Listener[] = []

const registerLoadingSessionFinishedListener = (l: Listener): Unsubscribe => {
  loadingSessionFinishedListeners.push(l)
  return () => {
    const index = loadingSessionFinishedListeners.indexOf(l)
    if (index > -1) {
      loadingSessionFinishedListeners.splice(index, 1)
    }
  }
}

const callLoadingSessionFinishedOnAllListeners = (): void => {
  loadingSessionFinishedListeners.forEach((l) => {
    l()
  })
}

const waitForLoadingSessionFinished = (
  timeoutMillis: number = 5_000
): Effect.Effect<void> => {
  let unsubscribe: Unsubscribe
  return Effect.async((callback) => {
    unsubscribe = registerLoadingSessionFinishedListener(() => {
      callback(Effect.succeed(undefined))
    })
  }).pipe(
    Effect.timeout(timeoutMillis),
    Effect.catchTag('TimeoutException', () => Effect.sync(unsubscribe))
  )
}

export function loadSession(
  {
    showErrorAlert,
    forceReload,
  }: {showErrorAlert: boolean; forceReload: boolean} = {
    showErrorAlert: false,
    forceReload: false,
  }
): T.Task<boolean> {
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
    !(sessionState === 'initial' || (forceReload && sessionState !== 'loading'))
  ) {
    logLoadSessionProgress(
      `Skippign loadSession. Result: ${sessionState === 'loggedIn'}`
    )
    return pipe(
      effectToTask(waitForLoadingSessionFinished()),
      T.chain(() => T.of(sessionState === 'loggedIn'))
    )
  }

  console.info('🔑Trying to find session in storage')
  getDefaultStore().set(sessionHolderAtom, {state: 'loading'})
  return pipe(
    readSessionFromStorage({
      asyncStorageKey: SESSION_KEY,
      secretStorageKey: SECRET_TOKEN_KEY,
    }),
    TE.match(
      (left) => {
        logLoadSessionProgress(
          `Error while loading session ${JSON.stringify(left)}`
        )

        if (left._tag === 'StoreEmpty') {
          console.info('🔑 No session in storage. User is logged out')
          getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
          return false
        }

        reportError(
          'error',
          new Error(
            '‼️ Error while reading or parsing user data from secure storage.'
          ),
          {left}
        )

        if (showErrorAlert) {
          const {t} = getDefaultStore().get(translationAtom)
          Alert.alert(
            t('errorGettingSession.title'),
            t('errorGettingSession.text', {errorCode: left._tag}),
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
      },
      (s) => {
        logLoadSessionProgress('🔑 We have a session 🎉. User is logged in.')
        getDefaultStore().set(sessionHolderAtom, {
          state: 'loggedIn',
          session: s,
        })
        return true
      }
    ),
    T.chainFirst(() => {
      callLoadingSessionFinishedOnAllListeners()
      return T.of(null)
    })
  )
}
