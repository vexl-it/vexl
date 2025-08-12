import {
  ENV_PRESETS,
  PlatformName,
  btcExchangeRate,
  chat,
  contact,
  content,
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
import {
  apiPreset,
  appSource,
  deviceModel,
  osVersion,
  version,
  versionCode,
} from '../utils/environment'
import {translationAtom} from '../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../utils/preferences'
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

  const {t} = get(translationAtom)
  const language = t('localeName')
  const isDeveloper = get(isDeveloperAtom)

  return {
    contact: contact.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      isDeveloper,
      getUserSessionCredentials,
    }),
    offer: offer.api({
      language,
      appSource,
      platform,
      clientSemver: version,
      clientVersion: versionCode,
      url: apiEnv.offerMs,
      isDeveloper,
      deviceModel,
      osVersion,
      getUserSessionCredentials,
    }),
    chat: chat.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.chatMs,
      deviceModel,
      osVersion,
      isDeveloper,
      getUserSessionCredentials,
    }),
    user: user.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      deviceModel,
      osVersion,
      url: apiEnv.userMs,
      isDeveloper,
      getUserSessionCredentials,
    }),
    location: location.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      deviceModel,
      osVersion,
      url: apiEnv.locationMs,
      isDeveloper,
      getUserSessionCredentials,
    }),
    notification: notification.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      isDeveloper,
      deviceModel,
      osVersion,
      url: apiEnv.notificationMs,
      getUserSessionCredentials,
    }),
    btcExchangeRate: btcExchangeRate.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.btcExchangeRateMs,
      isDeveloper,
      deviceModel,
      osVersion,
      getUserSessionCredentials,
    }),
    feedback: feedback.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.feedbackMs,
      isDeveloper,
      getUserSessionCredentials,
    }),
    content: content.api({
      language,
      appSource,
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      deviceModel,
      osVersion,
      url: apiEnv.contentMs,
      isDeveloper,
      getUserSessionCredentials,
    }),
  }
})
