import {Config} from 'effect'

export {
  cryptoConfig,
  healthServerPortConfig,
  isRunningInTestConfig,
  nodeEnvConfig,
  portConfig,
} from '@vexl-next/server-utils/src/commonConfigs'

export const WebflowTokenConfig = Config.string('WEBFLOW_TOKEN')
export const WebflowEventsCollectionIdConfig = Config.string(
  'WEBFLOW_EVENTS_COLLECTION_ID'
)
export const WebflowSpeakersCollectionIdConfig = Config.string(
  'WEBFLOW_SPEAKERS_COLLECTION_ID'
)

export const ClearCacheTokenHashConfig = Config.string('CLEAR_CACHE_TOKEN_HASH')
