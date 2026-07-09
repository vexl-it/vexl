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

export const disableImportContactsQuotaConfig = Config.boolean(
  'DISABLE_IMPORT_CONTACTS_QUOTA'
).pipe(Config.withDefault(false))

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

export const cleanReportedClubRecordsIntervalMsConfig = Config.number(
  'CLEAN_REPORTED_CLUB_RECORDS_INTERVAL_MS'
).pipe(Config.withDefault(24 * 60 * 60 * 1000))

export const clubReportLimistCount = Config.number('CLUB_REPORT_LIMIT_COUNT')

export const secretSaltForServerContact = Config.string(
  'SECRET_SALT_FOR_SERVER_CONTACTS'
)

export const s3Config = Config.all({
  region: Config.string('AWS_REGION').pipe(Config.withDefault('eu-west-1')),
  bucketName: Config.string('S3_BUCKET_NAME'),
  // Optional custom endpoint + path-style addressing for S3-compatible stores
  // (e.g. MinIO in local dev). Empty endpoint -> use the AWS SDK default.
  // Mirrors apps/backoffice-app/src/server/slideshows/config.ts.
  endpoint: Config.string('S3_ENDPOINT').pipe(Config.withDefault('')),
  forcePathStyle: Config.boolean('S3_FORCE_PATH_STYLE').pipe(
    Config.withDefault(false)
  ),
})

export const appVersionSupportingV2KeysConfig = Config.number(
  'APP_VERSION_SUPPORTING_V2_KEYS'
)

export const contactActiveWindowDaysConfig = Config.number(
  'CONTACT_ACTIVE_WINDOW_DAYS'
).pipe(
  Config.validate({
    validation: (d) => d > 0 || d === -1,
    message:
      'contactActiveWindowDaysConfig must be greater than 0 or equal to -1 (if you do not want to use this feature)',
  }),
  Config.withDefault(90)
)

export const contactPublicImportCountThresholdConfig = Config.number(
  'CONTACT_PUBLIC_IMPORT_COUNT_THRESHOLD'
).pipe(
  Config.validate({
    validation: (d) => Number.isInteger(d) && (d > 0 || d === -1),
    message:
      'contactPublicImportCountThresholdConfig must be a positive integer or -1 (if you do not want to use this feature)',
  }),
  Config.withDefault(-1)
)
