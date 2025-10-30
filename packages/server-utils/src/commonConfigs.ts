import {type PgClient} from '@effect/sql-pg'
import {
  PrivateKeyPemBase64E,
  PublicKeyPemBase64E,
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

export const isRunningInDevelopmentConfig = nodeEnvConfig.pipe(
  Config.map((env) => env === 'development')
)
export const isRunningInTestConfig = nodeEnvConfig.pipe(
  Config.map((env) => env === 'test')
)
export const isRunningInProductionConfig = nodeEnvConfig.pipe(
  Config.map((env) => env === 'production')
)

export const portConfig = Config.number('PORT')
export const healthServerPortConfig = Config.option(
  Config.number('HEALTH_PORT')
)

export const databaseConfig = Config.unwrap<PgClient.PgClientConfig>({
  url: Config.redacted('DB_URL'),
  username: Config.string('DB_USER'),
  password: Config.redacted('DB_PASSWORD'),
  debug: Config.boolean('DB_DEBUG').pipe(Config.withDefault(false)),
})

export const secretPublicKey = Config.string('SECRET_PUBLIC_KEY').pipe(
  Config.mapOrFail((v) =>
    Either.mapLeft(Schema.decodeEither(PublicKeyPemBase64E)(v), (e) =>
      ConfigError.InvalidData(['SECRET_PUBLIC_KEY'], e.message)
    )
  )
)

export const secretPrivateKey = Config.string('SECRET_PRIVATE_KEY').pipe(
  Config.mapOrFail((v) =>
    Either.mapLeft(Schema.decodeEither(PrivateKeyPemBase64E)(v), (e) =>
      ConfigError.InvalidData(['SECRET_PRIVATE_KEY'], e.message)
    )
  )
)

export const hmacKey = Config.string('SECRET_HMAC_KEY')
export const easKey = Config.string('SECRET_EAS_KEY')

export const cryptoConfig = {
  publicKey: secretPublicKey,
  privateKey: secretPrivateKey,
  hmacKey,
  easKey,
}

export const redisUrl = Config.string('REDIS_URL')

export const serviceNameConfig = Config.string('SERVICE_NAME')
export const serviceVersionConfig = Config.string('SERVICE_VERSION')

export const otlpTraceExporterUrlConfig = Config.option(
  Config.string('OTLP_TRACE_EXPORTER_URL')
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
