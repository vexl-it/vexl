import {ServiceUrl} from './ServiceUrl.brand'
import * as user from './services/user'

import * as UserSessionCredentials from './UserSessionCredentials.brand'

export interface CredentialHeaders {
  publicKey: string
  hash: string
  signature: string
}

export {user}

export const ENV_PRESETS = {
  stageEnv: {
    userMs: ServiceUrl.parse('https://stage-user.vexl.it'),
    contactMs: ServiceUrl.parse('https://stage-offer.vexl.it'),
    chatMs: ServiceUrl.parse('https://stage-chat.vexl.it'),
    offerMs: ServiceUrl.parse('https://stage-contact.vexl.it'),
  },
  prodEnv: {
    userMs: ServiceUrl.parse('https://user.vexl.it'),
    contactMs: ServiceUrl.parse('https://offer.vexl.it'),
    chatMs: ServiceUrl.parse('https://chat.vexl.it'),
    offerMs: ServiceUrl.parse('https://contact.vexl.it'),
  },
}

export {UserSessionCredentials}
