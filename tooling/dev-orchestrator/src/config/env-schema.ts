import {Config, ConfigError, Effect, Either} from 'effect'

/**
 * Aggregate all required environment variables using Effect Config.
 * Groups config by concern for clarity and maintenance.
 */
export const orchestratorConfig = Config.all({
  // Database (required for all services)
  database: Config.all({
    url: Config.string('DB_URL'),
    user: Config.string('DB_USER'),
    password: Config.redacted('DB_PASSWORD'),
    name: Config.string('DB_NAME').pipe(Config.withDefault('vexl-dev')),
  }),

  // Redis (required)
  redis: Config.all({
    url: Config.string('REDIS_URL'),
  }),

  // Ports (with defaults matching .env.example)
  ports: Config.all({
    postgres: Config.number('POSTGRES_PORT').pipe(Config.withDefault(5432)),
    redis: Config.number('REDIS_PORT').pipe(Config.withDefault(6379)),
    userService: Config.number('USER_SERVICE_PORT').pipe(
      Config.withDefault(3001)
    ),
    contactService: Config.number('CONTACT_SERVICE_PORT').pipe(
      Config.withDefault(3002)
    ),
    offerService: Config.number('OFFER_SERVICE_PORT').pipe(
      Config.withDefault(3003)
    ),
    chatService: Config.number('CHAT_SERVICE_PORT').pipe(
      Config.withDefault(3004)
    ),
    locationService: Config.number('LOCATION_SERVICE_PORT').pipe(
      Config.withDefault(3005)
    ),
    notificationService: Config.number('NOTIFICATION_SERVICE_PORT').pipe(
      Config.withDefault(3006)
    ),
    btcExchangeRateService: Config.number(
      'BTC_EXCHANGE_RATE_SERVICE_PORT'
    ).pipe(Config.withDefault(3007)),
    feedbackService: Config.number('FEEDBACK_SERVICE_PORT').pipe(
      Config.withDefault(3008)
    ),
    contentService: Config.number('CONTENT_SERVICE_PORT').pipe(
      Config.withDefault(3009)
    ),
    metricsService: Config.number('METRICS_SERVICE_PORT').pipe(
      Config.withDefault(3010)
    ),
  }),

  // Security keys (required)
  security: Config.all({
    publicKey: Config.string('SECRET_PUBLIC_KEY'),
    privateKey: Config.redacted('SECRET_PRIVATE_KEY'),
    hmacKey: Config.redacted('SECRET_HMAC_KEY'),
    easKey: Config.redacted('SECRET_EAS_KEY'),
  }),

  // Development settings (with defaults)
  dev: Config.all({
    nodeEnv: Config.string('NODE_ENV').pipe(Config.withDefault('development')),
    dummyNumbers: Config.string('LOGIN_CODE_DUMMY_NUMBERS').pipe(
      Config.withDefault('+420733333331')
    ),
    dummyCode: Config.string('LOGIN_CODE_DUMMY_CODE').pipe(
      Config.withDefault('111111')
    ),
    verificationProvider: Config.string('VERIFICATION_PROVIDER').pipe(
      Config.withDefault('prelude')
    ),
  }),
})

export type OrchestratorConfig = Config.Config.Success<
  typeof orchestratorConfig
>

/**
 * Helper to format ConfigError into readable messages.
 * Collects ALL errors before reporting (not just first).
 * Uses _op field to distinguish between error types.
 */
const formatConfigError = (
  error: ConfigError.ConfigError
): readonly string[] => {
  const messages: string[] = []

  const collect = (err: ConfigError.ConfigError): void => {
    if (ConfigError.isAnd(err)) {
      collect(err.left)
      collect(err.right)
    } else if (ConfigError.isOr(err)) {
      // For Or errors, just show the first option
      collect(err.left)
    } else if (ConfigError.isMissingData(err)) {
      messages.push(`Missing: ${err.path.join('.')}`)
    } else if (ConfigError.isInvalidData(err)) {
      messages.push(`Invalid: ${err.path.join('.')} - ${err.message}`)
    } else if (ConfigError.isSourceUnavailable(err)) {
      messages.push(`Unavailable: ${err.path.join('.')} - ${err.message}`)
    } else if (ConfigError.isUnsupported(err)) {
      messages.push(`Unsupported: ${err.path.join('.')} - ${err.message}`)
    }
  }

  collect(error)
  return messages
}

/**
 * Validates all required config at once.
 * Returns typed config on success, or fails with clear error messages.
 */
export const validateConfig = Effect.gen(function* () {
  const result = yield* Effect.either(orchestratorConfig)

  if (Either.isLeft(result)) {
    const errors = formatConfigError(result.left)
    yield* Effect.logError('Environment validation failed')
    yield* Effect.logError('')
    yield* Effect.logError('Missing or invalid environment variables:')
    for (const msg of errors) {
      yield* Effect.logError(`  - ${msg}`)
    }
    yield* Effect.logError('')
    yield* Effect.logError('Please update .env.local with the required values.')
    return yield* Effect.fail(result.left)
  }

  yield* Effect.log('Environment validation passed')
  return result.right
})
