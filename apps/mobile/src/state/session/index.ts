import AsyncStorage from '@react-native-async-storage/async-storage'
import {captureException} from '@sentry/react-native'
import {Effect} from 'effect/index'
import * as SecretStorage from 'expo-secure-store'
import * as O from 'fp-ts/Option'
import {
  atom,
  getDefaultStore,
  useAtomValue,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {type SessionV2} from '../../brands/Session.brand'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {replaceAll} from '../../utils/replaceAll'
import {dummySession} from './dummySesssion'
import writeSessionToStorage, {
  SECRET_TOKEN_KEY,
  SESSION_KEY,
} from './utils/writeSessionToStorage'

// duplicated code but we can not remove cyclic dependency otherwise
// --------------
function removeSensitiveData(string: string): string {
  const session = getDefaultStore().get(sessionDataOrDummyAtom)
  const toReplace = [
    session.sessionCredentials.signature,
    session.sessionCredentials.hash,
    session.sessionCredentials.publicKey,
    session.phoneNumber,
    session.privateKey.privateKeyPemBase64,
    // Strip V2 key material if present
    ...(session.keyPairV2
      ? [session.keyPairV2.publicKey, session.keyPairV2.privateKey]
      : []),
  ]
  return replaceAll(string, toReplace, '[[stripped]]')
}

function toJsonWithRemovedSensitiveData(object: any): string {
  try {
    const jsonString = JSON.stringify(object)
    return removeSensitiveData(jsonString)
  } catch (e) {
    captureException(
      new Error('Error stringify-ing object for sentry', {cause: e})
    )
    return '[[Error stringify-ing object]]'
  }
}

export function toExtraWithRemovedSensitiveData(
  extra: Record<string, unknown>
): Record<string, string> {
  return Object.entries(extra).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]:
        // Keep errors to get stacktrace
        value instanceof Error ? value : toJsonWithRemovedSensitiveData(value),
    }
  }, {})
}

function reportError(error: Error, extra: Record<string, unknown>): void {
  // We can not use reportError method because of circular require
  if (!__DEV__) {
    captureException(error, {
      level: 'error',
      extra: extra ? toExtraWithRemovedSensitiveData(extra) : undefined,
    })
  }
  console.error(error, extra)
}

// -------------- end of duplicated code

type SessionAtomValueType =
  | {readonly state: 'initial'}
  | {readonly state: 'loading'}
  | {readonly state: 'loggedOut'}
  | {readonly state: 'loggedIn'; readonly session: SessionV2}

export const sessionHolderAtom = atom({
  state: 'initial',
} as SessionAtomValueType)

export const sessionAtom: WritableAtom<
  SessionAtomValueType,
  [nextValue: O.Option<SessionV2>],
  void
> = atom(
  (get) => get(sessionHolderAtom),
  (get, set, nextValue) => {
    if (nextValue._tag === 'None') {
      console.info('🔑 Logging out user and removing session from storage.')

      void AsyncStorage.removeItem(SESSION_KEY)
      // V2 keys are now stored in session, so they are cleared automatically
      void SecretStorage.deleteItemAsync(SECRET_TOKEN_KEY)

      set(sessionHolderAtom, {state: 'loggedOut'})
      return
    }

    console.info('🔑 Logging in user')
    // TODO we should show UI indication that we are saving the session and also show error if it fails

    set(sessionHolderAtom, {state: 'loggedIn', session: nextValue.value})
    Effect.runFork(
      writeSessionToStorage(nextValue.value).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            reportError(
              new Error('‼️ Error while writing user data to secure storage.'),
              {error}
            )
            void AsyncStorage.removeItem(SESSION_KEY)
            void SecretStorage.deleteItemAsync(SECRET_TOKEN_KEY)
            set(sessionHolderAtom, {state: 'loggedOut'})
          })
        )
      )
    )
  }
)

export const userLoggedInAtom = atom((get) => {
  return get(sessionAtom).state === 'loggedIn'
})

const sessionLoadedAtom = atom((get) => {
  const state = get(sessionAtom).state
  return state === 'loggedIn' || state === 'loggedOut'
})

export const sessionDataOrDummyAtom = atom(
  (get) => {
    const session = get(sessionAtom)
    if (session.state === 'loggedIn') return session.session
    return dummySession
  },
  (get, set, action: SetStateAction<SessionV2>) => {
    const currentSession = get(sessionAtom)
    if (currentSession.state !== 'loggedIn') return
    const newValue: SessionV2 = getValueFromSetStateActionOfAtom(action)(
      () => currentSession.session
    )

    set(sessionAtom, O.some(newValue))
  }
)

export const sessionNotificationTokenAtom = focusAtom(
  sessionDataOrDummyAtom,
  (optic) => optic.prop('sessionNotificationToken')
)

// --------- hooks ---------
export function useSessionAssumeLoggedIn(): SessionV2 {
  const value = useAtomValue(sessionAtom)
  if (value.state === 'loggedIn') {
    return value.session
  }

  return dummySession
}

export function useIsUserLoggedIn(): boolean {
  return useAtomValue(userLoggedInAtom)
}

export function useIsSessionLoaded(): boolean {
  return useAtomValue(sessionLoadedAtom)
}
