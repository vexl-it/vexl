import * as restApi from '@vexl-next/rest-api'
import {ENV_PRESETS, EnvPreset, PlatformName} from '@vexl-next/rest-api'
import {type UserPublicApi} from '@vexl-next/rest-api/dist/services/user'
import {parseCredentialsJson, type UserCredentials} from './utils/auth'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {logDebug} from './utils/logging'
import {
  parseJson,
  safeParse,
} from '@vexl-next/resources-utils/dist/utils/parsing'

let ENV_PRESET = ENV_PRESETS.prodEnv
const clientVersion = 30

if (process.env.API_ENV_PRESET_KEY && process.env.API_ENV) {
  console.error(
    'Both API_ENV_PRESET_KEY and API_ENV are set. Please use only one of them.'
  )
  process.exit(1)
}

if (process.env.API_ENV_PRESET_KEY) {
  if (process.env.API_ENV_PRESET_KEY === 'stageEnv') {
    logDebug('Using stage environment')
    ENV_PRESET = ENV_PRESETS.prodEnv
  } else if (process.env.API_ENV_PRESET_KEY === 'prodEnv') {
    logDebug('Using prod environment')
    ENV_PRESET = ENV_PRESETS.prodEnv
  }
} else if (process.env.API_ENV) {
  pipe(
    process.env.API_ENV,
    parseJson,
    safeParse(EnvPreset),
    E.matchW(
      (e) => {
        console.error(
          `Invalid environment preset: ${String(process.env.API_ENV)}`,
          e.error.message
        )
        process.exit(1)
      },
      (preset) => {
        ENV_PRESET = preset
      }
    )
  )
}
logDebug('API Environment set to', ENV_PRESET)

export function getPublicApi(): {
  user: UserPublicApi
} {
  return {
    user: restApi.user.publicApi({
      url: ENV_PRESET.userMs,
      clientVersion,
      platform: PlatformName.parse('CLI'),
      loggingFunction: logDebug,
    }),
  }
}

// export function getPrivateApiFromCredentialsFile(credentialsPath: PathString) {
//   return pipe(parseAuthFile(credentialsPath), E.map(getPrivateApi))
// }

export function getPrivateApiFromCredentialsJsonString(
  credentialsJsonString: string
) {
  return pipe(parseCredentialsJson(credentialsJsonString), E.map(getPrivateApi))
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
      clientVersion,
      url: ENV_PRESET.chatMs,
      getUserSessionCredentials,
      loggingFunction: logDebug,
    }),

    contact: restApi.contact.privateApi({
      platform: PlatformName.parse('CLI'),
      clientVersion,
      url: ENV_PRESET.contactMs,
      getUserSessionCredentials,
      loggingFunction: logDebug,
    }),

    offer: restApi.offer.privateApi({
      platform: PlatformName.parse('CLI'),
      clientVersion,
      url: ENV_PRESET.offerMs,
      getUserSessionCredentials,
      loggingFunction: logDebug,
    }),
  }
}
