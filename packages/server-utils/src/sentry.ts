import * as Sentry from '@sentry/node'
import {scrubSensitiveDataInPlace} from '@vexl-next/generic-utils/src/scrubSensitiveData'
import {
  Cause,
  Context,
  Effect,
  FiberRef,
  FiberRefs,
  Layer,
  Logger,
  LogLevel,
  Option,
  Redacted,
  Tracer,
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
 * Reads the tracing span active in the logging fiber. Used to tag Sentry
 * events with the OpenTelemetry trace id so an event can be looked up in the
 * tracing backend (Sentry itself receives no spans).
 */
export const traceContextFromFiberRefs = (
  fiberRefs: FiberRefs.FiberRefs
): Option.Option<{traceId: string; spanId: string}> =>
  Context.getOption(
    FiberRefs.getOrDefault(fiberRefs, FiberRef.currentContext),
    Tracer.ParentSpan
  ).pipe(Option.map((span) => ({traceId: span.traceId, spanId: span.spanId})))

/**
 * Forwards every log at Error level and above to Sentry. All backend error
 * funnels (makeEndpointEffect, makeMiddlewareEffect, repeatingTask, MQ
 * consumers, runMainInNode) log unexpected errors, so hooking the logger
 * covers them all without touching individual call sites.
 */
const sentryCaptureLogger = Logger.make(
  ({annotations, cause, context, logLevel, message}) => {
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

    const trace = traceContextFromFiberRefs(context)
    const traceTags = Option.isSome(trace)
      ? {
          tags: {trace_id: trace.value.traceId, span_id: trace.value.spanId},
          contexts: {
            trace: {
              trace_id: trace.value.traceId,
              span_id: trace.value.spanId,
            },
          },
        }
      : {}

    const level = toSentryLevel(logLevel)
    if (error !== undefined) {
      Sentry.captureException(error, {
        level,
        extra,
        ...traceTags,
        // Group by error type + messages instead of stack traces. Effect
        // tagged errors are often constructed in shared helpers, so their
        // stacks would lump unrelated failures into a single issue.
        fingerprint: [error.name, error.message, title ?? ''],
      })
    } else {
      Sentry.captureMessage(title ?? 'Error log without message', {
        level,
        extra,
        ...traceTags,
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
