import {type PublicHosts} from '@/src/services/publicHosts'
import {Config, Effect} from 'effect'

export const backofficeDatabaseConfig = Config.all({
  host: Config.string('DB_HOST'),
  port: Config.number('DB_PORT'),
  username: Config.string('DB_USER'),
  password: Config.redacted('DB_PASSWORD'),
  database: Config.string('DB_NAME'),
})

export const adminTokenHashConfig = Config.string('ADMIN_TOKEN_HASH')

export const slideshowS3Config = Config.all({
  region: Config.string('AWS_REGION').pipe(Config.withDefault('eu-west-1')),
  bucketName: Config.string('S3_BUCKET_NAME'),
  resourcesBaseUrl: Config.string('RESOURCES_BASE_URL').pipe(
    Config.withDefault('https://resources.vexl.it')
  ),
  endpoint: Config.string('S3_ENDPOINT').pipe(Config.withDefault('')),
  forcePathStyle: Config.boolean('S3_FORCE_PATH_STYLE').pipe(
    Config.withDefault(false)
  ),
})

// `public` serves only the short-link redirects and TV slideshows; it is what
// runs behind the public hosts. `admin` serves everything.
export type BackofficeMode = 'admin' | 'public'
const backofficeModeConfig = Config.literal(
  'admin',
  'public'
)('BACKOFFICE_MODE').pipe(Config.withDefault<BackofficeMode>('admin'))

export const getBackofficeMode = (): BackofficeMode =>
  Effect.runSync(backofficeModeConfig)

const publicHostsConfig = Config.all({
  shortLinks: Config.string('SHORT_LINKS_HOST').pipe(
    Config.withDefault('go.vexl.it')
  ),
  slideshows: Config.string('SLIDESHOWS_HOST').pipe(
    Config.withDefault('slides.vexl.it')
  ),
})

export const getPublicHosts = (): PublicHosts =>
  Effect.runSync(publicHostsConfig)
