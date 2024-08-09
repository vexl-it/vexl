import {Config} from 'effect'

export {
  cryptoConfig,
  healthServerPortConfig,
  isRunningInTestConfig,
  nodeEnvConfig,
  portConfig,
} from '@vexl-next/server-utils/src/commonConfigs'

export const googlePlacesApiKeyConfig = Config.string('GOOGLE_PLACES_API_KEY')
export const btcExchangeRateUrlToRedirectToConfig = Config.string(
  'BTC_EXCHANGE_RATE_URL_TO_REDIRECT_TO'
)
