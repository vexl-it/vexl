import {Config, Effect, Schema} from 'effect'

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

export const firebaseCredentialsConfig = Config.string(
  'FIREBASE_CREDENTIALS'
).pipe(Effect.flatMap(Schema.decode(Schema.parseJson())))

export const inactivityNotificationAfterDaysConfig = Config.number(
  'INACTIVITY_NOTIFICATION_AFTER_DAYS'
)

export const newContentNotificationAfterConfig = Config.number(
  'NEW_CONTENT_NOTIFICATION_AFTER_DAYS'
)

export const dashboardContactsImportedHookConfig = Config.option(
  Config.string('DASHBOARD_CONTACTS_IMPORTED_HOOK')
)

export const initialImportContactsCountQuotaConfig = Config.number(
  'INITIAL_IMPORT_CONTACTS_COUNT_QUOTA'
)

export const importContactsCountQuotaConfig = Config.number(
  'IMPORT_CONTACTS_COUNT_QUOTA'
)

export const importContactsResetAfterDaysQuotaConfig = Config.number(
  'IMPORT_CONTACTS_RESET_AFTER_DAYS_QUOTA'
)
