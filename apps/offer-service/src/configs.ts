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
export const reportLimitIntervalDaysConfig = Config.number(
  'REPORT_LIMIT_INTERVAL_DAYS'
)
export const reportLimitCountConfig = Config.number('REPORT_LIMIT_COUNT')
export const cleanExpiredNotesIntervalMsConfig = Config.number(
  'CLEAN_EXPIRED_NOTES_INTERVAL_MS'
).pipe(Config.withDefault(60 * 60 * 1000))
export const cleanReportedRecordsIntervalMsConfig = Config.number(
  'CLEAN_REPORTED_RECORDS_INTERVAL_MS'
).pipe(Config.withDefault(24 * 60 * 60 * 1000))
