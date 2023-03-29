import * as restApi from '@vexl-next/rest-api'
import {ServiceUrl} from '@vexl-next/rest-api/dist/ServiceUrl.brand.js'
import {ENV_PRESETS, PlatformName} from '@vexl-next/rest-api'
import {type UserPublicApi} from '@vexl-next/rest-api/dist/services/user'
import {type UserCredentials} from './utils/auth'

export function getPublicApi(): {
  user: UserPublicApi
} {
  return {
    user: restApi.user.publicApi({
      url: ENV_PRESETS.stageEnv.userMs,
      platform: PlatformName.parse('CLI'),
    }),
  }
}

export function getPrivateApi(credentials: UserCredentials) {
  function getUserSessionCredentials() {
    return {
      signature: credentials.signature,
      hash: credentials.hash,
      publicKey: credentials.keypair.publicKeyPemBase64,
    }
  }

  return {
    chat: restApi.chat.privateApi({
      platform: PlatformName.parse('CLI'),
      url: ENV_PRESETS.stageEnv.chatMs,
      getUserSessionCredentials,
    }),

    contact: restApi.contact.privateApi({
      platform: PlatformName.parse('CLI'),
      url: ENV_PRESETS.stageEnv.contactMs,
      getUserSessionCredentials,
    }),

    offer: restApi.offer.privateApi({
      platform: PlatformName.parse('CLI'),
      url: ENV_PRESETS.stageEnv.offerMs,
      getUserSessionCredentials,
    }),
  }
}
