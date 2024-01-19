import AsyncStorage from '@react-native-async-storage/async-storage'
import crashlytics from '@react-native-firebase/crashlytics'
import {KeyHolder} from '@vexl-next/cryptography'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {
  type RealLifeInfo,
  type UserNameAndUriAvatar,
} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  phoneNumberToRegionCode,
  type RegionCode,
} from '@vexl-next/domain/src/utility/RegionCode.brand'
import * as SecretStorage from 'expo-secure-store'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {
  atom,
  getDefaultStore,
  useAtomValue,
  useSetAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {Session} from '../../brands/Session.brand'
import {askAreYouSureActionAtom} from '../../components/AreYouSureDialog'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {replaceAll} from '../../utils/replaceAll'
import {SECRET_TOKEN_KEY, SESSION_KEY} from './sessionKeys'
import {generateRandomUserData} from './utils/generateRandomUserData'
import writeSessionToStorage from './utils/writeSessionToStorage'

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
  phoneNumber: E164PhoneNumber.parse('+420733733733'),
  version: 0,
})

type SessionAtomValueType =
  | {readonly state: 'initial'}
  | {readonly state: 'loading'}
  | {readonly state: 'loggedOut'}
  | {readonly state: 'loggedIn'; readonly session: Session}

// ----- atoms -----
export const sessionHolderAtom = atom({
  state: 'initial',
} as SessionAtomValueType)

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
  (get, set, action: SetStateAction<Session>) => {
    const currentSession = get(sessionAtom)
    if (currentSession.state !== 'loggedIn') return
    const newValue: Session = getValueFromSetStateActionOfAtom(action)(
      () => currentSession.session
    )

    set(sessionAtom, O.some(newValue))
  }
)

export const anonymizedUserDataAtom = atom((get) => {
  const {privateKey} = get(sessionDataOrDummyAtom)
  return generateRandomUserData(privateKey?.publicKeyPemBase64)
})

export const realUserDataAtom = focusAtom(sessionDataOrDummyAtom, (p) =>
  p.prop('realUserData')
)

export const userDataRealOrAnonymizedAtom = atom<RealLifeInfo>((get) => {
  const real = get(realUserDataAtom)
  const anonymized = get(anonymizedUserDataAtom)

  return {
    userName: real?.userName ?? anonymized.userName,
    image: real?.image ?? anonymized.image,
  }
})

export const userPhoneNumberAtom = focusAtom(sessionDataOrDummyAtom, (p) =>
  p.prop('phoneNumber')
)

export const realUserNameAtom = atom(
  (get): UserName | undefined => {
    return get(realUserDataAtom)?.userName
  },
  (get, set, update: SetStateAction<UserName | undefined>) => {
    const newValue = getValueFromSetStateActionOfAtom(update)(
      () => get(realUserDataAtom)?.userName
    )

    set(realUserDataAtom, (old): UserNameAndUriAvatar => {
      return {...old, userName: newValue}
    })
  }
)

export const invalidUsernameUIFeedbackAtom = atom(null, async (get, set) => {
  const {t} = get(translationAtom)

  return await pipe(
    set(askAreYouSureActionAtom, {
      steps: [
        {
          type: 'StepWithText',
          title: t('editName.invalidUsername'),
          description: t('loginFlow.name.nameValidationError'),
          positiveButtonText: t('common.close'),
        },
      ],
      variant: 'danger',
    })
  )()
})

export const realUserImageAtom = atom(
  (get): UserNameAndUriAvatar['image'] | undefined => {
    return get(realUserDataAtom)?.image
  },
  (
    get,
    set,
    update: SetStateAction<UserNameAndUriAvatar['image'] | undefined>
  ) => {
    const newValue = getValueFromSetStateActionOfAtom(update)(
      () => get(realUserDataAtom)?.image
    )

    set(realUserDataAtom, (old): UserNameAndUriAvatar => {
      return {...old, image: newValue}
    })
  }
)

export const areRealUserDataSet = atom((get) => {
  const {userName, image} = get(realUserDataAtom) ?? {}
  return !!userName && !!image
})

export const regionCodeAtom = atom<RegionCode | undefined>((get) => {
  return phoneNumberToRegionCode(get(sessionDataOrDummyAtom).phoneNumber)
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
