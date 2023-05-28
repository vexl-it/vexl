import {atom, useAtomValue, useSetAtom, type WritableAtom} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as SecretStorage from 'expo-secure-store'
import * as TE from 'fp-ts/TaskEither'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {Session} from '../../brands/Session.brand'
import readSessionFromStorage from './readSessionFromStorage'
import writeSessionToStorage from './writeSessionToStorage'
import * as O from 'fp-ts/Option'
import {KeyHolder} from '@vexl-next/cryptography'
import {UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import crashlytics from '@react-native-firebase/crashlytics'
import {getDefaultStore} from 'jotai'
import {replaceAll} from '../../utils/replaceAll'

// duplicated code but we can not remove cyclic dependency otherwise
// --------------
function removeSensitiveData(string: string): string {
  const session = getDefaultStore().get(sessionDataOrDummyAtom)
  const toReplace = [
    session.sessionCredentials.signature,
    session.sessionCredentials.hash,
    session.sessionCredentials.publicKey,
    session.phoneNumber,
    session.realUserData.userName,
    session.privateKey.privateKeyPemBase64,
  ]
  return replaceAll(string, toReplace, '[[stripped]]')
}

function toJsonWithRemovedSensitiveData(object: any): string {
  try {
    const jsonString = JSON.stringify(object)
    return removeSensitiveData(jsonString)
  } catch (e) {
    crashlytics().recordError(
      new Error('Error stringify-ing object for crashlytics', {cause: e})
    )
    return '[[Error stringify-ing object]]'
  }
}

function reportError(message: string, errorData: unknown): void {
  // We can not use reportError method because of circular require
  if (!__DEV__) {
    crashlytics().log(message)
    crashlytics().log(toJsonWithRemovedSensitiveData(errorData))
    crashlytics().recordError(
      new Error('error while reading data from secure storage')
    )
  }
  console.error(message, errorData)
}

// -------------- end of duplicated code

const dummyPrivKey = KeyHolder.generatePrivateKey()
export const dummySession: Session = Session.parse({
  privateKey: dummyPrivKey,
  sessionCredentials: {
    hash: '',
    publicKey: dummyPrivKey.publicKeyPemBase64,
    signature: 'dummysign',
  },
  anonymizedUserData: {
    image: {
      type: 'imageUri',
      imageUri: UriString.parse(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAADUlEQVQIHWM4c+bMfwAIMANkxSThkAAAAABJRU5ErkJggg=='
      ),
    },
    userName: UserName.parse('Logout please'),
  },
  realUserData: {
    image: {
      type: 'imageUri',
      imageUri: UriString.parse(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAADUlEQVQIHWM4c+bMfwAIMANkxSThkAAAAABJRU5ErkJggg=='
      ),
    },
    userName: UserName.parse('Logout please'),
  },
  phoneNumber: E164PhoneNumber.parse('+420733733733'),
  version: 0,
})

const SESSION_KEY = 'session'
const SECRET_TOKEN_KEY = 'secretToken'

type SessionAtomValueType =
  | {readonly state: 'initial'}
  | {readonly state: 'loading'}
  | {readonly state: 'loggedOut'}
  | {readonly state: 'loggedIn'; readonly session: Session}

// ----- atoms -----
export const sessionHolderAtom = atom({
  state: 'initial',
} as SessionAtomValueType)

sessionHolderAtom.onMount = (setValue) => {
  void (async () => {
    console.info('🔑Trying to find session in storage')
    setValue({state: 'loading'})
    await pipe(
      readSessionFromStorage({
        asyncStorageKey: SESSION_KEY,
        secretStorageKey: SECRET_TOKEN_KEY,
      }),
      TE.match(
        (left) => {
          if (left._tag !== 'storeEmpty') {
            reportError(
              '‼️ Error while reading user data from secure storage.',
              left
            )
          }
          void AsyncStorage.removeItem(SESSION_KEY)
          void SecretStorage.deleteItemAsync(SECRET_TOKEN_KEY)
          console.info('🔑No usable session in storage. User is logged out.')

          setValue({state: 'loggedOut'})
        },
        (s) => {
          console.info('🔑 We have a session 🎉. User is logged in.')
          setValue({state: 'loggedIn', session: s})
        }
      )
    )()
  })()
}

export const sessionAtom: WritableAtom<
  SessionAtomValueType,
  [nextValue: O.Option<Session>],
  void
> = atom(
  (get) => get(sessionHolderAtom),
  (get, set, nextValue) => {
    if (nextValue._tag === 'None') {
      console.info('🔑 Logging out user and removing session from storage.')

      void AsyncStorage.removeItem(SESSION_KEY)
      void SecretStorage.deleteItemAsync(SECRET_TOKEN_KEY)

      set(sessionHolderAtom, {state: 'loggedOut'})
      return
    }

    console.info('🔑 Logging in user')
    // TODO we should show UI indication that we are saving the session and also show error if it fails

    set(sessionHolderAtom, {state: 'loggedIn', session: nextValue.value})
    void pipe(
      writeSessionToStorage(nextValue.value, {
        asyncStorageKey: SESSION_KEY,
        secretStorageKey: SECRET_TOKEN_KEY,
      }),
      TE.mapLeft((error) => {
        reportError(
          '‼️ Error while writing user data to secure storage.',
          error
        )
        void AsyncStorage.removeItem(SESSION_KEY)
        void SecretStorage.deleteItemAsync(SECRET_TOKEN_KEY)
        set(sessionHolderAtom, {state: 'loggedOut'})
      })
    )()
  }
)

const userLoggedInAtom = atom((get) => {
  return get(sessionAtom).state === 'loggedIn'
})

const sessionLoadedAtom = atom((get) => {
  const state = get(sessionAtom).state
  return state === 'loggedIn' || state === 'loggedOut'
})

export const sessionDataOrDummyAtom = atom((get) => {
  const session = get(sessionAtom)
  if (session.state === 'loggedIn') return session.session
  return dummySession
})

// --------- hooks ---------
export function useSetSession(): (newSession: Session) => void {
  const set = useSetAtom(sessionAtom)
  return (s) => {
    set(O.some(s))
  }
}

export function useSessionAssumeLoggedIn(): Session {
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
