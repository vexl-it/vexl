/**
 * Service registry + env builder.
 *
 * Describes every runnable HOST node process (the 10 backend services and the 3
 * web apps) and, for each, builds the COMPLETE non-secret env it should receive.
 * The supervisor (dev-backend.ts) layers the loaded `.env.local` secrets on top,
 * so anything here can be overridden.
 *
 * Each backend service gets its OWN database (DB_URL points at it). All backend
 * services receive the shared crypto keys, REDIS_URL, REDIS_NAMESPACE_PREFIX,
 * METRICS_QUEUE_NAME, OTLP_TRACE_EXPORTER_URL, SERVICE_NAME/VERSION and NODE_ENV
 * (via `commonServiceEnv`). Each service's `buildEnv` only adds its own extras.
 */
import {Array, pipe} from 'effect'
import devConfig, {type DevConfig} from '../../dev.config'
import {type Secrets} from './secrets'

export type ServiceKind = 'service' | 'web'

export interface ServiceNeeds {
  readonly db?: string
  readonly redis: boolean
  readonly s3: boolean
}

export type RunSpec =
  | {readonly type: 'tsx'; readonly entry: string}
  | {readonly type: 'pnpm-script'; readonly script: string}

export interface EnvContext {
  readonly cfg: DevConfig
  /** Effective ports (after applying .env.local overrides). */
  readonly ports: Record<string, number>
  readonly healthPorts: Record<string, number>
}

export interface RunnableApp {
  readonly name: string
  readonly workspaceName: string
  readonly dir: string
  readonly kind: ServiceKind
  readonly portKey: string
  readonly extraPortKeys?: readonly string[]
  readonly healthPortKey?: string
  readonly needs: ServiceNeeds
  readonly run: RunSpec
  readonly secretKeys?: readonly string[]
  /**
   * Service-specific env extras. The shared backend block is added separately
   * for `kind: 'service'` apps; `kind: 'web'` apps return their full env here.
   */
  readonly buildEnv: (ctx: EnvContext) => Record<string, string>
}

// --- small helpers ---------------------------------------------------------

const stringifyValues = (
  obj: Record<string, string | number | boolean>
): Record<string, string> =>
  Object.fromEntries(
    pipe(
      Object.entries(obj),
      Array.map(([key, value]) => [key, String(value)])
    )
  )

const serviceNameOf = (name: string): string =>
  name.replace(/-/g, '_').toUpperCase()

const httpUrl = (ctx: EnvContext, portKey: string): string =>
  `http://${ctx.cfg.infra.host}:${ctx.ports[portKey]}`

const dbEnv = (ctx: EnvContext, dbName: string): Record<string, string> => ({
  DB_URL: `postgresql://${ctx.cfg.infra.host}:${ctx.ports.postgres}/${dbName}`,
  DB_USER: ctx.cfg.infra.postgres.user,
  DB_PASSWORD: ctx.cfg.infra.postgres.password,
  // Split form for apps reading DB_HOST/DB_PORT/DB_NAME (backoffice/dashboard).
  DB_HOST: ctx.cfg.infra.host,
  DB_PORT: String(ctx.ports.postgres),
  DB_NAME: dbName,
})

const s3Env = (ctx: EnvContext): Record<string, string> => ({
  S3_ENDPOINT: httpUrl(ctx, 'minioApi'),
  S3_FORCE_PATH_STYLE: 'true',
  S3_BUCKET_NAME: ctx.cfg.infra.minio.bucket,
  AWS_REGION: ctx.cfg.infra.minio.region,
  AWS_ACCESS_KEY_ID: ctx.cfg.infra.minio.rootUser,
  AWS_SECRET_ACCESS_KEY: ctx.cfg.infra.minio.rootPassword,
})

/** Shared env block applied to every `kind: 'service'` app. */
const commonServiceEnv = (
  ctx: EnvContext,
  app: RunnableApp
): Record<string, string> => ({
  NODE_ENV: ctx.cfg.common.NODE_ENV,
  LOG_FORMAT: ctx.cfg.common.LOG_FORMAT,
  SERVICE_NAME: serviceNameOf(app.name),
  SERVICE_VERSION: ctx.cfg.common.SERVICE_VERSION,
  PORT: String(ctx.ports[app.portKey]),
  ...(app.healthPortKey !== undefined
    ? {HEALTH_PORT: String(ctx.healthPorts[app.healthPortKey])}
    : {}),
  REDIS_URL: `redis://${ctx.cfg.infra.host}:${ctx.ports.redis}`,
  REDIS_NAMESPACE_PREFIX: ctx.cfg.infra.redis.namespacePrefix,
  METRICS_QUEUE_NAME: ctx.cfg.infra.redis.metricsQueueName,
  DISABLE_METRICS: ctx.cfg.common.DISABLE_METRICS,
  OTLP_TRACE_EXPORTER_URL: ctx.cfg.common.OTLP_TRACE_EXPORTER_URL,
  ...ctx.cfg.devCryptoKeys,
  ...(app.needs.db !== undefined ? dbEnv(ctx, app.needs.db) : {}),
})

const tsxService = (entry: string): RunSpec => ({type: 'tsx', entry})

// --- the registry ----------------------------------------------------------

const dbn = devConfig.dbNames
const sc = devConfig.serviceConstants

export const SERVICES: readonly RunnableApp[] = [
  {
    name: 'user-service',
    workspaceName: '@vexl-next/user-service',
    dir: 'apps/user-service',
    kind: 'service',
    portKey: 'userService',
    healthPortKey: 'userService',
    needs: {db: dbn.user, redis: true, s3: false},
    run: tsxService('src/index.ts'),
    secretKeys: [
      'PRELUDE_API_TOKEN',
      'TURNSTILE_SECRET_KEY',
      'TURNSTILE_EXPECTED_HOSTNAME',
    ],
    buildEnv: (ctx) => ({
      FEEDBACK_URL_TO_REDIRECT_TO: httpUrl(ctx, 'feedbackService'),
      // Existing webhook mechanism: notify the dashboard's updates server when a
      // new user registers, so its UI updates live.
      DASHBOARD_NEW_USER_HOOK: `${httpUrl(ctx, 'dashboardUpdates')}/new-user`,
      ...ctx.cfg.dummyLogin,
      ...stringifyValues(sc.userService),
    }),
  },
  {
    name: 'contact-service',
    workspaceName: '@vexl-next/contact-service',
    dir: 'apps/contact-service',
    kind: 'service',
    portKey: 'contactService',
    healthPortKey: 'contactService',
    needs: {db: dbn.contact, redis: true, s3: true},
    run: tsxService('src/index.ts'),
    secretKeys: [
      'EXPO_ACCESS_TOKEN',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
    ],
    buildEnv: (ctx) => ({
      // Optional feature; real token via .env.local enables Expo push.
      EXPO_ACCESS_TOKEN: '',
      // Existing webhook mechanism: notify the dashboard's updates server when
      // contacts are imported, so its connection metrics update live.
      DASHBOARD_CONTACTS_IMPORTED_HOOK: `${httpUrl(ctx, 'dashboardUpdates')}/new-connections`,
      ...stringifyValues(sc.contactService),
      ...s3Env(ctx),
    }),
  },
  {
    name: 'offer-service',
    workspaceName: '@vexl-next/offer-service',
    dir: 'apps/offer-service',
    kind: 'service',
    portKey: 'offerService',
    healthPortKey: 'offerService',
    needs: {db: dbn.offer, redis: true, s3: false},
    run: tsxService('src/index.ts'),
    buildEnv: () => stringifyValues(sc.offerService),
  },
  {
    name: 'chat-service',
    workspaceName: '@vexl-next/chat-service',
    dir: 'apps/chat-service',
    kind: 'service',
    portKey: 'chatService',
    healthPortKey: 'chatService',
    needs: {db: dbn.chat, redis: true, s3: false},
    run: tsxService('src/index.ts'),
    buildEnv: () => stringifyValues(sc.chatService),
  },
  {
    name: 'location-service',
    workspaceName: '@vexl-next/location-service',
    dir: 'apps/location-service',
    kind: 'service',
    portKey: 'locationService',
    healthPortKey: 'locationService',
    needs: {redis: false, s3: false},
    run: tsxService('src/index.ts'),
    secretKeys: ['GOOGLE_PLACES_API_KEY'],
    buildEnv: (ctx) => ({
      // Optional feature; real key via .env.local enables autocomplete.
      GOOGLE_PLACES_API_KEY: '',
      BTC_EXCHANGE_RATE_URL_TO_REDIRECT_TO: httpUrl(
        ctx,
        'btcExchangeRateService'
      ),
    }),
  },
  {
    name: 'notification-service',
    workspaceName: '@vexl-next/notification-service',
    dir: 'apps/notification-service',
    kind: 'service',
    portKey: 'notificationService',
    healthPortKey: 'notificationService',
    needs: {db: dbn.notification, redis: true, s3: false},
    run: tsxService('src/index.ts'),
    secretKeys: [
      'EXPO_ACCESS_TOKEN',
      'FCM_TOKEN_PUBLIC_KEY',
      'FCM_TOKEN_PRIVATE_KEY',
    ],
    buildEnv: (ctx) => ({
      EXPO_ACCESS_TOKEN: '',
      // Reuse the dev ECDSA pair for notification-token signing in dev. Override
      // via .env.local for real FCM signing.
      FCM_TOKEN_PUBLIC_KEY: ctx.cfg.devCryptoKeys.SECRET_PUBLIC_KEY,
      FCM_TOKEN_PRIVATE_KEY: ctx.cfg.devCryptoKeys.SECRET_PRIVATE_KEY,
    }),
  },
  {
    name: 'btc-exchange-rate-service',
    workspaceName: '@vexl-next/btc-exchange-rate-service',
    dir: 'apps/btc-exchange-rate-service',
    kind: 'service',
    portKey: 'btcExchangeRateService',
    healthPortKey: 'btcExchangeRateService',
    needs: {redis: false, s3: false},
    run: tsxService('src/index.ts'),
    buildEnv: () => ({}),
  },
  {
    name: 'feedback-service',
    workspaceName: '@vexl-next/feedback-service',
    dir: 'apps/feedback-service',
    kind: 'service',
    portKey: 'feedbackService',
    healthPortKey: 'feedbackService',
    needs: {db: dbn.feedback, redis: false, s3: false},
    run: tsxService('src/index.ts'),
    buildEnv: () => ({}),
  },
  {
    name: 'content-service',
    workspaceName: '@vexl-next/content-service',
    dir: 'apps/content-service',
    kind: 'service',
    portKey: 'contentService',
    healthPortKey: 'contentService',
    needs: {db: dbn.content, redis: false, s3: false},
    run: tsxService('src/index.ts'),
    secretKeys: [
      'WEBFLOW_TOKEN',
      'WEBFLOW_EVENTS_COLLECTION_ID',
      'WEBFLOW_SPEAKERS_COLLECTION_ID',
      'WEBFLOW_BLOG_COLLECTION_ID',
      'CLEAR_CACHE_TOKEN_HASH',
      'BTC_PAY_SERVER_URL',
      'BTC_PAY_SERVER_API_KEY',
      'BTC_PAY_SERVER_STORE_ID',
      'BTC_PAY_SERVER_WEBHOOK_SECRET',
    ],
    buildEnv: () => ({
      ...stringifyValues(sc.contentService),
      // Optional integrations — empty by default, set in .env.local to enable.
      WEBFLOW_TOKEN: '',
      WEBFLOW_EVENTS_COLLECTION_ID: '',
      WEBFLOW_SPEAKERS_COLLECTION_ID: '',
      WEBFLOW_BLOG_COLLECTION_ID: '',
      CLEAR_CACHE_TOKEN_HASH: '',
      BTC_PAY_SERVER_URL: '',
      BTC_PAY_SERVER_API_KEY: '',
      BTC_PAY_SERVER_STORE_ID: '',
      BTC_PAY_SERVER_WEBHOOK_SECRET: '',
    }),
  },
  {
    name: 'metrics-service',
    workspaceName: '@vexl-next/metrics-service',
    dir: 'apps/metrics-service',
    kind: 'service',
    portKey: 'metricsService',
    healthPortKey: 'metricsService',
    needs: {db: dbn.metrics, redis: true, s3: false},
    run: tsxService('src/index.ts'),
    buildEnv: () => ({}),
  },
]

export const WEB_APPS: readonly RunnableApp[] = [
  {
    name: 'backoffice-app',
    workspaceName: '@vexl-next/backoffice-app',
    dir: 'apps/backoffice-app',
    kind: 'web',
    portKey: 'backofficeApp',
    needs: {db: dbn.backoffice, redis: false, s3: true},
    run: {type: 'pnpm-script', script: 'dev'},
    secretKeys: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    buildEnv: (ctx) => ({
      NODE_ENV: ctx.cfg.common.NODE_ENV,
      SERVICE_NAME: 'BACKOFFICE_APP',
      SERVICE_VERSION: ctx.cfg.common.SERVICE_VERSION,
      PORT: String(ctx.ports.backofficeApp),
      ...dbEnv(ctx, dbn.backoffice),
      ADMIN_TOKEN_HASH: sc.backofficeApp.ADMIN_TOKEN_HASH,
      CONTACT_API_INTERNAL_URL: httpUrl(ctx, 'contactService'),
      CONTENT_API_INTERNAL_URL: httpUrl(ctx, 'contentService'),
      ...s3Env(ctx),
      RESOURCES_BASE_URL: `${httpUrl(ctx, 'minioApi')}/${ctx.cfg.infra.minio.bucket}`,
    }),
  },
  {
    name: 'account-deletion-website',
    workspaceName: 'account-deletion-website',
    dir: 'apps/account-deletion-website',
    kind: 'web',
    portKey: 'accountDeletionWebsite',
    needs: {redis: false, s3: false},
    run: {type: 'pnpm-script', script: 'dev'},
    buildEnv: (ctx) => ({
      NODE_ENV: ctx.cfg.common.NODE_ENV,
      PORT: String(ctx.ports.accountDeletionWebsite),
      // NOTE: this site has no `local` backend preset — getEnvPreset() only
      // switches prod vs stage. With BE_ENV unset it talks to the STAGE backend.
    }),
  },
  {
    name: 'dashboard-app',
    workspaceName: '@vexl-next/dashboard-app',
    dir: 'apps/dashboard-app',
    kind: 'web',
    // The UI is served by the vite dev server (the `dev` script runs both the
    // node server and `vite dev`); display/validate that port.
    portKey: 'dashboardUi',
    extraPortKeys: [
      'dashboardClient',
      'dashboardUpdates',
      'dashboardSocket',
      'dashboardHealth',
    ],
    needs: {db: dbn.contact, redis: false, s3: false},
    // `dev` = `dev:server` (tsx server/index.ts) + `dev:client` (vite dev). The
    // server reads the contact db read-only; vite serves the UI and proxies
    // /websocket -> the socket server (SOCKET_SERVER_PORT).
    run: {type: 'pnpm-script', script: 'dev'},
    buildEnv: (ctx) => ({
      NODE_ENV: ctx.cfg.common.NODE_ENV,
      LOG_FORMAT: ctx.cfg.common.LOG_FORMAT,
      SERVICE_NAME: 'DASHBOARD_APP',
      SERVICE_VERSION: ctx.cfg.common.SERVICE_VERSION,
      PORT: String(ctx.ports.dashboardClient),
      UPDATES_SERVER_PORT: String(ctx.ports.dashboardUpdates),
      SOCKET_SERVER_PORT: String(ctx.ports.dashboardSocket),
      HEALTH_PORT: String(ctx.ports.dashboardHealth),
      ...dbEnv(ctx, dbn.contact),
      DB_DATABASE_NAME_CONTACT: dbn.contact,
    }),
  },
]

export const ALL_APPS: readonly RunnableApp[] = [...SERVICES, ...WEB_APPS]

const APP_BY_NAME: Record<string, RunnableApp> = Object.fromEntries(
  pipe(
    ALL_APPS,
    Array.map((app) => [app.name, app])
  )
)

export const findApp = (name: string): RunnableApp | undefined =>
  APP_BY_NAME[name]

/** All databases the Postgres init script must create. */
export const allDatabaseNames = (): readonly string[] =>
  Object.values(devConfig.dbNames)

const pickSecrets = (
  keys: readonly string[] | undefined,
  secrets: Secrets
): Secrets => {
  const result: Secrets = {}
  if (keys === undefined) return result

  for (const key of keys) {
    const value = secrets[key]
    if (value !== undefined) result[key] = value
  }
  return result
}

/**
 * Build the final env for one app: shared backend block (services only) + the
 * app's own extras + declared `.env.local` secrets layered on top (secrets win).
 */
export const buildFinalEnv = (
  app: RunnableApp,
  ctx: EnvContext,
  secrets: Secrets
): Record<string, string> => {
  const base = app.kind === 'service' ? commonServiceEnv(ctx, app) : {}
  return {
    ...base,
    ...app.buildEnv(ctx),
    ...pickSecrets(app.secretKeys, secrets),
  }
}
