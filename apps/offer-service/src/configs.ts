import {Config} from 'effect'

export {
  cryptoConfig,
  databaseConfig,
  easKey,
  healthServerPortConfig,
  hmacKey,
  isRunningInDevelopmentConfig,
  isRunningInTestConfig,
  nodeEnvConfig,
  portConfig,
  redisUrl,
  secretPrivateKey,
  secretPublicKey,
} from '@vexl-next/server-utils/src/commonConfigs'

export const expirationPeriodDaysConfig = Config.number(
  'EXPIRATION_PERIOD_DAYS'
)
export const offerReportFilterConfig = Config.number('OFFER_REPORT_FILTER')
export const reportLimitIntervalDays = Config.number(
  'REPORT_LIMIT_INTERVAL_DAYS'
)
export const reportLimitCount = Config.number('REPORT_LIMIT_COUNT')
