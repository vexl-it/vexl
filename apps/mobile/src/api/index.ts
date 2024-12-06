import {
  ENV_PRESETS,
  PlatformName,
  btcExchangeRate,
  chat,
  contact,
  feedback,
  location,
  notification,
  offer,
  user,
  type EnvPreset,
} from '@vexl-next/rest-api'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'

import {Schema} from 'effect'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {dummySession, sessionHolderAtom} from '../state/session'
import {apiPreset, version, versionCode} from '../utils/environment'
// import {ServiceUrl} from '@vexl-next/rest-api/src/ServiceUrl.brand'

export const platform = Schema.decodeSync(PlatformName)(
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

export const apiAtom = atom((get) => {
  function getUserSessionCredentials(): UserSessionCredentials {
    const session = get(sessionCredentialsAtom)
    return session
  }

  return {
    contact: contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials,
    }),
    offer: offer.api({
      platform,
      clientSemver: version,
      clientVersion: versionCode,
      url: apiEnv.offerMs,
      getUserSessionCredentials,
    }),
    chat: chat.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.chatMs,
      getUserSessionCredentials,
    }),
    user: user.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.userMs,
      getUserSessionCredentials,
    }),
    location: location.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.locationMs,
      getUserSessionCredentials,
    }),
    notification: notification.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.notificationMs,
      getUserSessionCredentials,
    }),
    btcExchangeRate: btcExchangeRate.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.btcExchangeRateMs,
      getUserSessionCredentials,
    }),
    feedback: feedback.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.feedbackMs,
      getUserSessionCredentials,
    }),
  }
})
