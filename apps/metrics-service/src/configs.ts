import {defaultAnalyticsWindow} from '@vexl-next/analytics-definitions/src/core'
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
} from '@vexl-next/server-utils/src/commonConfigs'

export const analyticsWindowConfig = Config.all({
  graceDays: Config.integer('ANALYTICS_GRACE_DAYS').pipe(
    Config.withDefault(defaultAnalyticsWindow.graceDays)
  ),
  settleDays: Config.integer('ANALYTICS_SETTLE_DAYS').pipe(
    Config.withDefault(defaultAnalyticsWindow.settleDays)
  ),
})

export const analyticsRetentionDaysConfig = Config.integer(
  'ANALYTICS_RETENTION_DAYS'
).pipe(Config.withDefault(540))

export const analyticsExpiryCronConfig = Config.string(
  'ANALYTICS_EXPIRY_CRON'
).pipe(Config.withDefault('15 3 * * *'))
