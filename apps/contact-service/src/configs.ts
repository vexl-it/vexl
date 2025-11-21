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

export const adminTokenConfigHash = Config.string('ADMIN_TOKEN_HASH')

export const expoAccessTokenConfig = Config.string('EXPO_ACCESS_TOKEN')

export const ClubLinkTemplateConfig = Config.string('CLUB_LINK_TEMPLATE')

export const clubRemoveAfterMarkedAsDeletedDaysConfig = Config.number(
  'CLUB_REMOVE_AFTER_MARKED_AS_DELETED_DAYS'
)

export const clubMemberExpirationAfterDaysOfInactivityConfig = Config.number(
  'CLUB_MEMBER_EXPIRATION_AFTER_DAYS_OF_INACTIVITY'
)

export const clubReportLimitIntervalDaysConfig = Config.number(
  'CLUB_REPORT_LIMIT_INTERVAL_DAYS'
)

export const clubReportLimistCount = Config.number('CLUB_REPORT_LIMIT_COUNT')

export const secretSaltForServerContact = Config.string(
  'SECRET_SALT_FOR_SERVER_CONTACTS'
)

export const s3Config = Config.all({
  accessKeyId: Config.string('AWS_ACCESS_KEY_ID').pipe(Config.option),
  secretAccessKey: Config.string('AWS_SECRET_ACCESS_KEY').pipe(Config.option),
  region: Config.string('AWS_REGION').pipe(Config.withDefault('eu-west-1')),
  bucketName: Config.string('S3_BUCKET_NAME'),
  profile: Config.string('AWS_PROFILE').pipe(Config.option),
})
