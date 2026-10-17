import {OhttpKeyConfig} from '@vexl-next/cryptography/src/operations/ohttp.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {Option, Schema} from 'effect'
import {ServiceUrl} from './ServiceUrl.brand'
import * as UserSessionCredentials from './UserSessionCredentials.brand'
import * as btcExchangeRate from './services/btcExchangeRate'
import * as chat from './services/chat'
import * as contact from './services/contact'
import * as content from './services/content'
import * as feedback from './services/feedback'
import * as location from './services/location'
import * as metrics from './services/metrics'
import * as notification from './services/notification'
import * as offer from './services/offer'
import * as user from './services/user'

export const EnvPreset = Schema.Struct({
  userMs: ServiceUrl,
  contactMs: ServiceUrl,
  chatMs: ServiceUrl,
  offerMs: ServiceUrl,
  locationMs: ServiceUrl,
  notificationMs: ServiceUrl,
  btcExchangeRateMs: ServiceUrl,
  feedbackMs: ServiceUrl,
  contentMs: ServiceUrl,
  metrics: ServiceUrl,
  // None disables analytics uploads: there is no direct, non-relayed path.
  analyticsRelay: Schema.OptionFromSelf(
    Schema.Struct({
      relayUrls: Schema.NonEmptyArray(ServiceUrl),
      gatewayKeyConfig: OhttpKeyConfig,
    })
  ),
})
export type EnvPreset = Schema.Schema.Type<typeof EnvPreset>

export interface CredentialHeaders {
  publicKey: string
  hash: string
  signature: string
}

export {
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
}

export const ENV_PRESETS: {stageEnv: EnvPreset; prodEnv: EnvPreset} = {
  stageEnv: {
    userMs: Schema.decodeSync(ServiceUrl)('https://stage-user.vexl.it'),
    contactMs: Schema.decodeSync(ServiceUrl)('https://stage-contact.vexl.it'),
    chatMs: Schema.decodeSync(ServiceUrl)('https://stage-chat.vexl.it'),
    offerMs: Schema.decodeSync(ServiceUrl)('https://stage-offer2.vexl.it'),
    locationMs: Schema.decodeSync(ServiceUrl)('https://stage-location.vexl.it'),
    notificationMs: Schema.decodeSync(ServiceUrl)(
      'https://stage-notification.vexl.it'
    ),
    btcExchangeRateMs: Schema.decodeSync(ServiceUrl)(
      'https://stage-btc-exchange-rate.vexl.it'
    ),
    feedbackMs: Schema.decodeSync(ServiceUrl)('https://stage-feedback.vexl.it'),
    contentMs: Schema.decodeSync(ServiceUrl)('https://stage-content.vexl.it'),
    metrics: Schema.decodeSync(ServiceUrl)('https://stage-metrics.vexl.it'),
    analyticsRelay: Option.none(),
  },
  prodEnv: {
    userMs: Schema.decodeSync(ServiceUrl)('https://user.vexl.it'),
    contactMs: Schema.decodeSync(ServiceUrl)('https://contact.vexl.it'),
    chatMs: Schema.decodeSync(ServiceUrl)('https://chat.vexl.it'),
    offerMs: Schema.decodeSync(ServiceUrl)('https://offer2.vexl.it'),
    locationMs: Schema.decodeSync(ServiceUrl)('https://location.vexl.it'),
    notificationMs: Schema.decodeSync(ServiceUrl)(
      'https://notification.vexl.it'
    ),
    btcExchangeRateMs: Schema.decodeSync(ServiceUrl)(
      'https://btc-exchange-rate.vexl.it'
    ),
    feedbackMs: Schema.decodeSync(ServiceUrl)('https://feedback.vexl.it'),
    contentMs: Schema.decodeSync(ServiceUrl)('https://content.vexl.it'),
    metrics: Schema.decodeSync(ServiceUrl)('https://metrics.vexl.it'),
    analyticsRelay: Option.none(),
  },
}
export {PlatformName, UserSessionCredentials}
