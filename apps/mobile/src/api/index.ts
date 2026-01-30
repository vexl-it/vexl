import {
  ENV_PRESETS,
  PlatformName,
  btcExchangeRate,
  chat,
  contact,
  content,
  feedback,
  location,
  metrics,
  notification,
  offer,
  user,
  type EnvPreset,
} from '@vexl-next/rest-api'
import {ServiceUrl} from '@vexl-next/rest-api/src/ServiceUrl.brand'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'

import {FetchHttpClient} from '@effect/platform/index'
import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect, Option, Schema} from 'effect'
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

export const platform = Schema.decodeSync(PlatformName)(
  Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
)

/**
 * Build localEnv from EXPO_PUBLIC_* environment variables.
 * Orchestrator sets these vars when spawning Expo for local development.
 * Returns null if any required env var is missing (fallback to stage).
 */
function buildLocalEnvFromEnvVars(): EnvPreset | null {
  const userMs = process.env.EXPO_PUBLIC_LOCAL_USER_MS
  const contactMs = process.env.EXPO_PUBLIC_LOCAL_CONTACT_MS
  const chatMs = process.env.EXPO_PUBLIC_LOCAL_CHAT_MS
  const offerMs = process.env.EXPO_PUBLIC_LOCAL_OFFER_MS
  const locationMs = process.env.EXPO_PUBLIC_LOCAL_LOCATION_MS
  const notificationMs = process.env.EXPO_PUBLIC_LOCAL_NOTIFICATION_MS
  const btcExchangeRateMs = process.env.EXPO_PUBLIC_LOCAL_BTC_EXCHANGE_RATE_MS
  const feedbackMs = process.env.EXPO_PUBLIC_LOCAL_FEEDBACK_MS
  const contentMs = process.env.EXPO_PUBLIC_LOCAL_CONTENT_MS
  const metricsMs = process.env.EXPO_PUBLIC_LOCAL_METRICS_MS

  if (
    !userMs ||
    !contactMs ||
    !chatMs ||
    !offerMs ||
    !locationMs ||
    !notificationMs ||
    !btcExchangeRateMs ||
    !feedbackMs ||
    !contentMs ||
    !metricsMs
  ) {
    console.warn('Local env vars not fully configured, falling back to stage')
    return null
  }

  return {
    userMs: Schema.decodeSync(ServiceUrl)(userMs),
    contactMs: Schema.decodeSync(ServiceUrl)(contactMs),
    chatMs: Schema.decodeSync(ServiceUrl)(chatMs),
    offerMs: Schema.decodeSync(ServiceUrl)(offerMs),
    locationMs: Schema.decodeSync(ServiceUrl)(locationMs),
    notificationMs: Schema.decodeSync(ServiceUrl)(notificationMs),
    btcExchangeRateMs: Schema.decodeSync(ServiceUrl)(btcExchangeRateMs),
    feedbackMs: Schema.decodeSync(ServiceUrl)(feedbackMs),
    contentMs: Schema.decodeSync(ServiceUrl)(contentMs),
    metrics: Schema.decodeSync(ServiceUrl)(metricsMs),
  }
}

export function getApiPreset(): EnvPreset {
  if (apiPreset === 'prodEnv') {
    return ENV_PRESETS.prodEnv
  }

  if (apiPreset === 'localEnv') {
    const localEnv = buildLocalEnvFromEnvVars()
    if (localEnv) {
      return localEnv
    }
    // Fallback to stage if env vars not configured
  }

  return ENV_PRESETS.stageEnv
}

export const apiEnv = getApiPreset()
// export const apiEnv = {
//   userMs: Schema.decodeSync(ServiceUrl)('http://localhost:8000'),
//   contactMs: Schema.decodeSync(ServiceUrl)('http://localhost:8003'),
//   offerMs: Schema.decodeSync(ServiceUrl)('http://localhost:8002'),
//   chatMs: Schema.decodeSync(ServiceUrl)('http://localhost:8001'),
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

export const apiAtom = atom((get) =>
  Effect.gen(function* (_) {
    function getUserSessionCredentials(): UserSessionCredentials {
      const session = get(sessionCredentialsAtom)
      return session
    }

    const {t} = get(translationAtom)
    const language = t('localeName')
    const isDeveloper = get(isDeveloperAtom)

    const sessionHolder = get(sessionHolderAtom)
    const prefix =
      sessionHolder.state === 'loggedIn'
        ? yield* _(
            countryPrefixFromNumber(sessionHolder.session.phoneNumber).pipe(
              Effect.option
            )
          )
        : Option.none()

    return {
      contact: yield* _(
        contact.api({
          language,
          appSource,
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          url: apiEnv.contactMs,
          isDeveloper,
          getUserSessionCredentials,
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      offer: yield* _(
        offer.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      chat: yield* _(
        chat.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      user: yield* _(
        user.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      location: yield* _(
        location.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      notification: yield* _(
        notification.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      btcExchangeRate: yield* _(
        btcExchangeRate.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      feedback: yield* _(
        feedback.api({
          language,
          appSource,
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          url: apiEnv.feedbackMs,
          isDeveloper,
          getUserSessionCredentials,
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      content: yield* _(
        content.api({
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
          prefix: Option.getOrUndefined(prefix),
        })
      ),
      metrics: yield* _(
        metrics.api({
          language,
          appSource,
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          deviceModel,
          osVersion,
          url: apiEnv.metrics,
          isDeveloper,
          getUserSessionCredentials,
          prefix: Option.getOrUndefined(prefix),
        })
      ),
    }
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)
)
