import {HttpsUrlString} from '@vexl-next/domain/src/utility/HttpsUrlString.brand'
import {Config, Schema} from 'effect'

export {
  cryptoConfig,
  databaseConfig,
  healthServerPortConfig,
  isRunningInTestConfig,
  nodeEnvConfig,
  portConfig,
} from '@vexl-next/server-utils/src/commonConfigs'

export const vexlBlogUrlTemplateConfig = Config.string('VEXL_BLOG_URL_TEMPLATE')

export const adminTokenConfigHash = Config.string('ADMIN_TOKEN_HASH')

export const contentEditorTokenHashConfig = Config.string(
  'CONTENT_EDITOR_TOKEN_HASH'
)

export const btcPayServerUrlConfig = Config.string('BTC_PAY_SERVER_URL')
export const btcPayServerApiKeyConfig = Config.string('BTC_PAY_SERVER_API_KEY')
export const btcPayServerStoreIdConfig = Config.string(
  'BTC_PAY_SERVER_STORE_ID'
)
export const btcPayServerWebhookSecretConfig = Config.string(
  'BTC_PAY_SERVER_WEBHOOK_SECRET'
)

export const forceUpdateForVersionAndLowerConfig = Config.number(
  'FORCE_UPDATE_FOR_VERSION_AND_LOWER'
).pipe(Config.withDefault(0))

export const appInMaintenanceModeConfig = Config.boolean(
  'APP_IN_MAINTENANCE_MODE'
).pipe(Config.withDefault(false))

export const trustedFriendsEnabledConfig = Config.boolean(
  'TRUSTED_FRIENDS_ENABLED'
).pipe(Config.withDefault(false))

export const lightMapStyleUrlConfig = Schema.Config(
  'LIGHT_MAP_STYLE_URL',
  HttpsUrlString
).pipe(
  Config.withDefault(
    Schema.decodeSync(HttpsUrlString)(
      'https://tiles.openfreemap.org/styles/positron'
    )
  )
)

export const darkMapStyleUrlConfig = Schema.Config(
  'DARK_MAP_STYLE_URL',
  HttpsUrlString
).pipe(
  Config.withDefault(
    Schema.decodeSync(HttpsUrlString)(
      'https://tiles.openfreemap.org/styles/dark'
    )
  )
)
