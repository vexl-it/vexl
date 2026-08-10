import * as Sentry from '@sentry/node'
import {scrubSensitiveDataInPlace} from '@vexl-next/generic-utils/src/scrubSensitiveData'
import {
  Cause,
  Effect,
  Layer,
  Logger,
  LogLevel,
  Option,
  Redacted,
  type ConfigError,
} from 'effect'
import {
  nodeEnvConfig,
  sentryDsnConfig,
  serviceVersionConfig,
} from './commonConfigs'

const toSentryLevel = (logLevel: LogLevel.LogLevel): Sentry.SeverityLevel =>
  logLevel._tag === 'Fatal' ? 'fatal' : 'error'

/**
 * Forwards every log at Error level and above to Sentry. All backend error
 * funnels (makeEndpointEffect, makeMiddlewareEffect, repeatingTask, MQ
 * consumers, runMainInNode) log unexpected errors, so hooking the logger
 * covers them all without touching individual call sites.
 */
const sentryCaptureLogger = Logger.make(
  ({annotations, cause, logLevel, message}) => {
    if (!LogLevel.greaterThanEqual(logLevel, LogLevel.Error)) return

    const parts = Array.isArray(message) ? message : [message]
    const title = parts.find((part): part is string => typeof part === 'string')
    const causeError = Cause.isEmpty(cause) ? undefined : Cause.squash(cause)
    const error = [causeError, ...parts].find(
      (part): part is Error => part instanceof Error
    )

    const extra: Record<string, unknown> = {
      logMessage: title,
      details: parts.filter((part) => part !== title && part !== error),
      annotations: Object.fromEntries(annotations),
    }
    if (causeError !== undefined && causeError !== error)
      extra.cause = causeError

    const level = toSentryLevel(logLevel)
    if (error !== undefined) {
      Sentry.captureException(error, {
        level,
        extra,
        // Group by error type + messages instead of stack traces. Effect
        // tagged errors are often constructed in shared helpers, so their
        // stacks would lump unrelated failures into a single issue.
        fingerprint: [error.name, error.message, title ?? ''],
      })
    } else {
      Sentry.captureMessage(title ?? 'Error log without message', {
        level,
        extra,
      })
    }
  }
)

/**
 * Initializes Sentry error reporting when SENTRY_DSN is configured and
 * registers a logger that reports all Error/Fatal logs. No-op otherwise.
 * Tracing stays on the existing OpenTelemetry setup; Sentry only receives
 * errors, with breadcrumbs dropped and events scrubbed of sensitive data.
 */
export const sentryLayer: Layer.Layer<never, ConfigError.ConfigError> =
  Layer.unwrapEffect(
    Effect.gen(function* (_) {
      const dsn = yield* _(sentryDsnConfig)
      if (Option.isNone(dsn)) {
        yield* _(
          Effect.log(
            'Sentry error reporting is disabled because SENTRY_DSN is not configured.'
          )
        )
        return Layer.empty
      }

      const environment = yield* _(nodeEnvConfig)
      const release = yield* _(serviceVersionConfig)

      yield* _(
        Effect.sync(() => {
          Sentry.init({
            dsn: Redacted.value(dsn.value),
            environment,
            release,
            // The app runs its own OpenTelemetry NodeSdk for tracing; without
            // this flag Sentry would register a competing tracer provider.
            skipOpenTelemetrySetup: true,
            sendDefaultPii: false,
            beforeBreadcrumb: () => null,
            beforeSend: (event) => {
              scrubSensitiveDataInPlace(event)
              return event
            },
          })
        })
      )
      yield* _(Effect.logInfo('Sentry error reporting enabled', {environment}))

      return Layer.merge(
        Logger.add(sentryCaptureLogger),
        Layer.scopedDiscard(
          Effect.addFinalizer(() =>
            Effect.promise(async () => {
              await Sentry.close(2000)
            }).pipe(Effect.ignore)
          )
        )
      )
    })
  )
