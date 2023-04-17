import {atom, useAtomValue, useSetAtom, type WritableAtom} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as SecretStorage from 'expo-secure-store'
import * as TE from 'fp-ts/TaskEither'
import reportError from '../../utils/reportError'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {type Session} from '../../brands/Session.brand'
import readSessionFromStorage from './readSessionFromStorage'
import writeSessionToStorage from './writeSessionToStorage'
import * as O from 'fp-ts/Option'
import {useFinishPostLoginFlow} from '../postLoginOnboarding'
import {clearStorage} from '../../utils/fpMmkv'

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
            const error =
              left._tag === 'errorReadingFromStore' ? left.error : null
            reportError(
              'error',
              '‼️ Error while reading user data from secure storage.',
              error,
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

const sessionAtom: WritableAtom<
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
          'error',
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
  // TODO find a better way to handle this. Should we logout the user?
  throw new Error(
    'useSessionAssumeLoggedIn() was called but user was not logged in.'
  )
}

export function useIsUserLoggedIn(): boolean {
  return useAtomValue(userLoggedInAtom)
}

export function useIsSessionLoaded(): boolean {
  return useAtomValue(sessionLoadedAtom)
}

export function useLogout(): () => void {
  const setSession = useSetAtom(sessionAtom)
  const setFinishedPostOnboarding = useFinishPostLoginFlow()
  return () => {
    setSession(O.none)
    setFinishedPostOnboarding(false)
    clearStorage()
  }
}
