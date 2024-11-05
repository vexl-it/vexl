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

export const requestTimeoutDaysConfig = Config.number('REQUEST_TIMEOUT_DAYS')
export const challengeExpirationMinutesConfig = Config.number(
  'CHALLENGE_EXPIRATION_MINUTES'
)

export const messageExpirationLowerLimitDaysConfig = Config.number(
  'MESSAGE_EXPIRATION_LOWER_LIMIT_DAYS'
)

export const messageExpirationUpperLimitDaysConfig = Config.number(
  'MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS'
)
