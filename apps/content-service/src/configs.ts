import {Config} from 'effect'

export {
  cryptoConfig,
  healthServerPortConfig,
  isRunningInTestConfig,
  nodeEnvConfig,
  portConfig,
} from '@vexl-next/server-utils/src/commonConfigs'

export const webflowTokenConfig = Config.string('WEBFLOW_TOKEN')
export const webflowEventsCollectionIdConfig = Config.string(
  'WEBFLOW_EVENTS_COLLECTION_ID'
)
export const webflowSpeakersCollectionIdConfig = Config.string(
  'WEBFLOW_SPEAKERS_COLLECTION_ID'
)
export const webflowBlogCollectionIdConfig = Config.string(
  'WEBFLOW_BLOG_COLLECTION_ID'
)

export const vexlBlogUrlTemplateConfig = Config.string('VEXL_BLOG_URL_TEMPLATE')

export const clearCacheTokenHashConfig = Config.string('CLEAR_CACHE_TOKEN_HASH')

export const btcPayServerUrlConfig = Config.string('BTC_PAY_SERVER_URL')
export const btcPayServerApiKeyConfig = Config.string('BTC_PAY_SERVER_API_KEY')
export const btcPayServerStoreIdConfig = Config.string(
  'BTC_PAY_SERVER_STORE_ID'
)
export const btcPayServerWebhookSecretConfig = Config.string(
  'BTC_PAY_SERVER_WEBHOOK_SECRET'
)
