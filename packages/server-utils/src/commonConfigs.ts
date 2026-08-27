import {type PgClient} from '@effect/sql-pg'
import {PrivateKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyPemBase64,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Config, ConfigError, Effect, Either, Option, Schema} from 'effect'

export const nodeEnvConfig = Config.string('NODE_ENV').pipe(
  Config.withDefault('production'),
  Config.validate({
    message: "NODE_ENV must be one of 'development', or 'production' or 'test'",
    validation: (x): x is 'production' | 'development' | 'test' =>
      x === 'development' || x === 'production' || x === 'test',
  })
)

export const RedisNamespacePrefixConfig = Config.string(
  'REDIS_NAMESPACE_PREFIX'
).pipe(
  Config.validate({
    message:
      'REDIS_NAMESPACE_PREFIX must only contain letters, numbers, and underscores',
    validation: (x) => /^[a-zA-Z0-9_]+$/.test(x),
  })
)

export const isRunningInDevelopmentConfig = nodeEnvConfig.pipe(
  Config.map((env) => env === 'development')
)
export const isRunningInTestConfig = nodeEnvConfig.pipe(
  Config.map((env) => env === 'test')
)
export const isRunningInProductionConfig = nodeEnvConfig.pipe(
  Config.map((env) => env === 'production')
)

/**
 * Log output format. `json` emits structured JSON logs (parsed into fields by
 * Loki/Grafana), `pretty` emits human-readable colored logs. When unset it
 * defaults to JSON in production and pretty otherwise, preserving prior
 * behavior. Lets the dev stack get Grafana-friendly JSON logs without flipping
 * NODE_ENV (which would also enable rate limiting, disable dev tools, etc.).
 */
export const logFormatConfig = Config.literal(
  'json',
  'pretty'
)('LOG_FORMAT').pipe(Config.option)

export const useJsonLogsConfig = Effect.map(
  Effect.all([isRunningInProductionConfig, logFormatConfig]),
  ([inProd, format]) =>
    Option.match(format, {
      onSome: (selected) => selected === 'json',
      onNone: () => inProd,
    })
)

export const portConfig = Config.number('PORT')
export const healthServerPortConfig = Config.option(
  Config.number('HEALTH_PORT')
)

export const makeDatabaseConfig = (vars: {
  url: string
  username: string
  password: string
}): Effect.Effect<PgClient.PgClientConfig, ConfigError.ConfigError> =>
  Config.unwrap({
    url: Config.string(vars.url),
    username: Config.string(vars.username),
    password: Config.redacted(vars.password),
  }).pipe(
    Effect.map((config): PgClient.PgClientConfig => {
      const parsedUrl = new URL(config.url)
      return {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : 5432,
        database: parsedUrl.pathname.slice(1), // Remove leading '/'
        username: config.username,
        password: config.password,
        // sslmode=require means "encrypt, don't verify the cert" (libpq
        // semantics) — RDS certs are not in Node's default trust store, so
        // plain `ssl: true` would be rejected as self-signed.
        ...(parsedUrl.searchParams.get('sslmode') === 'require'
          ? {ssl: {rejectUnauthorized: false}}
          : {}),
      }
    })
  )

export const databaseConfig = makeDatabaseConfig({
  url: 'DB_URL',
  username: 'DB_USER',
  password: 'DB_PASSWORD',
})

export const secretPublicKey = Config.string('SECRET_PUBLIC_KEY').pipe(
  Config.mapOrFail((v) =>
    Either.mapLeft(Schema.decodeEither(PublicKeyPemBase64)(v), (e) =>
      ConfigError.InvalidData(['SECRET_PUBLIC_KEY'], e.message)
    )
  )
)

export const secretPrivateKey = Config.string('SECRET_PRIVATE_KEY').pipe(
  Config.mapOrFail((v) =>
    Either.mapLeft(Schema.decodeEither(PrivateKeyPemBase64)(v), (e) =>
      ConfigError.InvalidData(['SECRET_PRIVATE_KEY'], e.message)
    )
  )
)

export const hmacKey = Config.string('SECRET_HMAC_KEY')
export const easKey = Config.string('SECRET_EAS_KEY')

export const libsodiumPrivateKey = Config.string('LIBSODIUM_PRIVATE_KEY').pipe(
  Config.mapOrFail((v) =>
    Either.mapLeft(Schema.decodeEither(PrivateKeyV2)(v), (e) =>
      ConfigError.InvalidData(['LIBSODIUM_PRIVATE_KEY'], e.message)
    )
  )
)

export const cryptoConfig = {
  publicKey: secretPublicKey,
  privateKey: secretPrivateKey,
  hmacKey,
  easKey,
  libsodiumPrivateKey,
}

export const redisUrl = Config.string('REDIS_URL')

export const serviceNameConfig = Config.string('SERVICE_NAME')
export const serviceVersionConfig = Config.string('SERVICE_VERSION')

export const otlpTraceExporterUrlConfig = Config.option(
  Config.string('OTLP_TRACE_EXPORTER_URL')
)

export const sentryDsnConfig = Config.option(Config.redacted('SENTRY_DSN'))

/**
 * Sentry environment label (production/stage/...). Falls back to NODE_ENV,
 * which cannot distinguish stage from production because stage also runs with
 * NODE_ENV=production.
 */
export const sentryEnvironmentConfig = Config.option(
  Config.string('SENTRY_ENVIRONMENT')
)

/**
 * Base url of the Grafana instance (e.g. https://grafana.vexl.it). When set,
 * Sentry events include a link to the trace in Grafana Explore.
 */
export const grafanaUrlConfig = Config.option(Config.string('GRAFANA_URL'))

/**
 * Uid of the Tempo datasource in Grafana. When set together with GRAFANA_URL,
 * the trace link in Sentry events opens Grafana Explore with the Tempo
 * datasource preselected, so the trace query runs on click.
 */
export const grafanaTempoDatasourceUidConfig = Config.option(
  Config.string('GRAFANA_TEMPO_DATASOURCE_UID')
)

export const metricsConfig = Config.option(
  Config.unwrap({
    prometheusPort: Config.number('PROMETHEUS_PORT'),
    prometheusEndpoint: Config.string('PROMETHEUS_ENDPOINT'),
  })
)

export const internalServerPortConfig = Config.option(
  Config.number('INTERNAL_SERVER_PORT')
)

export const memoryDebugIntervalMsConfig = Config.option(
  Config.number('MEMORY_DEBUG_INTERVAL_MS')
)

export const disableDevToolsInDevelopmentConfig = Config.option(
  Config.boolean('DISABLE_DEV_TOOLS')
)

export const metricsQueueNameConfig = Config.string('METRICS_QUEUE_NAME')

export const disableMetricsInDevelopmentConfig = Config.option(
  Config.boolean('DISABLE_METRICS')
)

export const shouldDisableMetrics = Effect.gen(function* (_) {
  const isRunningInDevelopment = yield* _(isRunningInDevelopmentConfig)
  const disableMetrics = yield* _(
    disableMetricsInDevelopmentConfig,
    Effect.map(Option.getOrElse(() => false))
  )

  if (disableMetrics && !isRunningInDevelopment) {
    yield* _(
      Effect.logWarning(
        'Trying to disable metrics when NOT in development mode. To prevent accidents, metrics will NOT be disabled.'
      )
    )
    return false
  }

  const disable = isRunningInDevelopment && disableMetrics
  if (disable) yield* _(Effect.log('Disabling metrics in development mode'))
  return disable
})

export const enableRateLimitingInDevelopmentConfig = Config.boolean(
  'ENABLE_RATE_LIMITING_IN_DEVELOPMENT'
).pipe(Config.withDefault(false))

export const rateLimitPerIpMultiplierConfig = Config.number(
  'RATE_LIMIT_PER_IP_MULTIPLIER'
).pipe(Config.withDefault(100))

export const keepAliveTimeoutMsConfig = Config.number(
  'KEEP_ALIVE_TIMEOUT_MS'
).pipe(
  Config.withDefault(20000) // 20 seconds
)

export const headersTimeoutMsConfig = Config.number('HEADERS_TIMEOUT_MS').pipe(
  Config.withDefault(25000) // 25 seconds
)

export const requestTimeoutMsConfig = Config.number('REQUEST_TIMEOUT_MS').pipe(
  Config.withDefault(40000) // 40 seconds
)

export const challengeExpirationMinutesConfig = Config.number(
  'CHALLENGE_EXPIRATION_MINUTES'
).pipe(Config.withDefault(10))
