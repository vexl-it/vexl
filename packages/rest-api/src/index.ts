import {z} from 'zod'
import {ServiceUrl} from './ServiceUrl.brand'
import * as user from './services/user'
import * as contact from './services/contact'
import * as offer from './services/offer'
import * as chat from './services/chat'

import {PlatformName} from './PlatformName'
import * as UserSessionCredentials from './UserSessionCredentials.brand'

export const EnvPreset = z.object({
  userMs: ServiceUrl,
  contactMs: ServiceUrl,
  chatMs: ServiceUrl,
  offerMs: ServiceUrl,
})
export type EnvPreset = z.TypeOf<typeof EnvPreset>

export interface CredentialHeaders {
  publicKey: string
  hash: string
  signature: string
}

export {user, contact, offer, chat}

export const ENV_PRESETS: {stageEnv: EnvPreset; prodEnv: EnvPreset} = {
  stageEnv: {
    userMs: ServiceUrl.parse('https://stage-user.vexl.it'),
    contactMs: ServiceUrl.parse('https://stage-contact.vexl.it'),
    chatMs: ServiceUrl.parse('https://stage-chat.vexl.it'),
    offerMs: ServiceUrl.parse('https://stage-offer2.vexl.it'),
  },
  prodEnv: {
    userMs: ServiceUrl.parse('https://user.vexl.it'),
    contactMs: ServiceUrl.parse('https://contact.vexl.it'),
    chatMs: ServiceUrl.parse('https://chat.vexl.it'),
    offerMs: ServiceUrl.parse('https://offer2.vexl.it'),
  },
}

export {UserSessionCredentials}
export {PlatformName}
