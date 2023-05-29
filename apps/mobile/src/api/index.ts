import {atom, useAtomValue} from 'jotai'
import {
  chat,
  contact,
  ENV_PRESETS,
  type EnvPreset,
  location,
  offer,
  PlatformName,
  user,
} from '@vexl-next/rest-api'
import {Platform} from 'react-native'
import {dummySession, sessionHolderAtom} from '../state/session'
import {type UserSessionCredentials} from '@vexl-next/rest-api/dist/UserSessionCredentials.brand'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {
  type UserPrivateApi,
  type UserPublicApi,
} from '@vexl-next/rest-api/dist/services/user'
import {apiPreset, versionCode} from '../utils/environment'
import {type LocationPublicApi} from '@vexl-next/rest-api/dist/services/location'
// import {ServiceUrl} from '@vexl-next/rest-api/dist/ServiceUrl.brand'

export const platform = PlatformName.parse(
  Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
)

function getApiPreset(): EnvPreset {
  if (apiPreset === 'prodEnv') {
    return ENV_PRESETS.prodEnv
  }

  return ENV_PRESETS.stageEnv
}

export const apiEnv = getApiPreset()
// export const apiEnv = {
//   userMs: ServiceUrl.parse('http://localhost:8000'),
//   contactMs: ServiceUrl.parse('http://localhost:8003'),
//   offerMs: ServiceUrl.parse('http://localhost:8002'),
//   chatMs: ServiceUrl.parse('http://localhost:8001'),
// }

const _publicApiAtom = atom({
  user: user.publicApi({
    clientVersion: versionCode,
    url: apiEnv.userMs,
    platform,
  }),
  location: location.publicApi({
    platform,
    clientVersion: versionCode,
    url: apiEnv.locationMs,
  }),
})

export const publicApiAtom = atom((get) => get(_publicApiAtom))

export function useUserPublicApi(): UserPublicApi {
  return useAtomValue(publicApiAtom).user
}

export function useLocationPublicApi(): LocationPublicApi {
  return useAtomValue(publicApiAtom).location
}

const sessionCredentialsAtom = atom<UserSessionCredentials>((get) => {
  const session = get(sessionHolderAtom)
  if (session.state !== 'loggedIn') {
    console.warn(
      '👀 User is not logged in. Using dummy session. But user should be logged out.'
    )
    return dummySession.sessionCredentials
  }

  return session.session.sessionCredentials
})

export const privateApiAtom = atom((get) => {
  function getUserSessionCredentials(): UserSessionCredentials {
    const session = get(sessionCredentialsAtom)
    return session
  }

  return {
    contact: contact.privateApi({
      platform,
      clientVersion: versionCode,
      url: apiEnv.contactMs,
      getUserSessionCredentials,
    }),
    offer: offer.privateApi({
      platform,
      clientVersion: versionCode,
      url: apiEnv.offerMs,
      getUserSessionCredentials,
    }),
    chat: chat.privateApi({
      platform,
      clientVersion: versionCode,
      url: apiEnv.chatMs,
      getUserSessionCredentials,
    }),
    user: user.privateApi({
      platform,
      clientVersion: versionCode,
      url: apiEnv.userMs,
      getUserSessionCredentials,
    }),
  }
})

export function usePrivateApiAssumeLoggedIn(): {
  contact: ContactPrivateApi
  offer: OfferPrivateApi
  chat: ChatPrivateApi
  user: UserPrivateApi
} {
  return useAtomValue(privateApiAtom)
}
