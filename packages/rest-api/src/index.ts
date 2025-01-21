import {Schema} from 'effect'
import {PlatformName} from './PlatformName'
import {ServiceUrl} from './ServiceUrl.brand'
import * as UserSessionCredentials from './UserSessionCredentials.brand'
import * as btcExchangeRate from './services/btcExchangeRate'
import * as chat from './services/chat'
import * as contact from './services/contact'
import * as content from './services/content'
import * as feedback from './services/feedback'
import * as location from './services/location'
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
  },
}

export {PlatformName, UserSessionCredentials}
