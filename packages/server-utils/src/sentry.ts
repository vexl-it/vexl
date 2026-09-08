import * as Sentry from '@sentry/node'
import {scrubSensitiveDataInPlace} from '@vexl-next/generic-utils/src/scrubSensitiveData'
import {
  Cause,
  Context,
  Effect,
  Layer,
  Logger,
  Option,
  pipe,
  Redacted,
  References,
  Tracer,
  type Config,
  type LogLevel,
} from 'effect'
import {
  grafanaTempoDatasourceUidConfig,
  grafanaUrlConfig,
  nodeEnvConfig,
  sentryDsnConfig,
  sentryEnvironmentConfig,
  serviceVersionConfig,
} from './commonConfigs'

const toSentryLevel = (logLevel: LogLevel.LogLevel): Sentry.SeverityLevel =>
  logLevel === 'Fatal' ? 'fatal' : 'error'

/**
 * Reads the tracing span active in the logging fiber. Used to tag Sentry
 * events with the OpenTelemetry trace id so an event can be looked up in the
 * tracing backend (Sentry itself receives no spans).
 */
export const traceContextFromContext = (
  context: Context.Context<never>
): Option.Option<{traceId: string; spanId: string}> =>
  Context.getOption(context, Tracer.ParentSpan).pipe(
    Option.map((span) => ({traceId: span.traceId, spanId: span.spanId}))
  )

/**
 * Deep link into Grafana Explore with a TraceQL query for the given trace.
 * Without the Tempo datasource uid, Grafana opens Explore on the user's
 * default datasource and the query does not run on click.
 */
export const grafanaTraceUrl = (
  grafanaBaseUrl: string,
  traceId: string,
  tempoDatasourceUid?: string
): string => {
  const baseUrl = grafanaBaseUrl.replace(/\/$/, '')
  if (tempoDatasourceUid === undefined) {
    const query = encodeURIComponent(
      JSON.stringify({queries: [{query: traceId, queryType: 'traceql'}]})
    )
    return `${baseUrl}/explore?left=${query}`
  }

  const pane = {
    datasource: tempoDatasourceUid,
    queries: [
      {
        refId: 'A',
        datasource: {type: 'tempo', uid: tempoDatasourceUid},
        queryType: 'traceql',
        query: traceId,
        limit: 20,
        tableType: 'traces',
      },
    ],
    // Wide range on purpose — the link may be clicked days after the event,
    // and a trace-id lookup is cheap regardless of range.
    range: {from: 'now-7d', to: 'now'},
  }
  const panes = encodeURIComponent(JSON.stringify({sentry: pane}))
  return `${baseUrl}/explore?schemaVersion=1&panes=${panes}&orgId=1`
}

/**
 * Effect errors carry only their construction site plus fiber-runtime
 * internals as a JS stack — the logical call path exists as the Effect span
 * stack instead. `Cause.prettyErrors` rewrites the stack (recursively through
 * `cause`): internal frames are stripped and span frames are appended, so
 * Sentry shows a logical async trace.
 */
export const prettifyError = (
  error: Error,
  cause?: Cause.Cause<unknown>
): Error => Cause.prettyErrors(cause ?? Cause.fail(error))[0] ?? error

/**
 * Forwards every log at Error level and above to Sentry. All backend error
 * funnels (makeEndpointEffect, makeMiddlewareEffect, repeatingTask, MQ
 * consumers, runMainInNode) log unexpected errors, so hooking the logger
 * covers them all without touching individual call sites.
 */
const makeSentryCaptureLogger = (
  grafanaUrl: Option.Option<string>,
  grafanaTempoDatasourceUid: Option.Option<string>
): Logger.Logger<unknown, void> =>
  Logger.make(({cause, fiber, logLevel, message}) => {
    if (logLevel !== 'Error' && logLevel !== 'Fatal') return

    const parts = Array.isArray(message) ? message : [message]
    const title = parts.find((part): part is string => typeof part === 'string')
    const causeError =
      cause.reasons.length === 0 ? undefined : Cause.squash(cause)
    const error = [causeError, ...parts].find(
      (part): part is Error => part instanceof Error
    )

    const extra: Record<string, unknown> = {
      logMessage: title,
      details: parts.filter((part) => part !== title && part !== error),
      annotations: fiber.getRef(References.CurrentLogAnnotations),
    }
    if (causeError !== undefined && causeError !== error)
      extra.cause = causeError

    const trace = traceContextFromContext(fiber.context)
    if (Option.isSome(trace) && Option.isSome(grafanaUrl))
      extra.grafanaTraceUrl = grafanaTraceUrl(
        grafanaUrl.value,
        trace.value.traceId,
        Option.getOrUndefined(grafanaTempoDatasourceUid)
      )
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
      Sentry.captureException(
        prettifyError(error, error === causeError ? cause : undefined),
        {
          level,
          extra,
          ...traceTags,
          // Group by error type + messages instead of stack traces. Effect
          // tagged errors are often constructed in shared helpers, so their
          // stacks would lump unrelated failures into a single issue.
          fingerprint: [error.name, error.message, title ?? ''],
        }
      )
    } else {
      Sentry.captureMessage(title ?? 'Error log without message', {
        level,
        extra,
        ...traceTags,
      })
    }
  })

/**
 * Initializes Sentry error reporting when SENTRY_DSN is configured and
 * registers a logger that reports all Error/Fatal logs. No-op otherwise.
 * Tracing stays on the existing OpenTelemetry setup; Sentry only receives
 * errors, with breadcrumbs dropped and events scrubbed of sensitive data.
 */
export const sentryLayer: Layer.Layer<never, Config.ConfigError> = Layer.unwrap(
  Effect.gen(function* () {
    const dsn = yield* sentryDsnConfig
    if (Option.isNone(dsn)) {
      yield* Effect.log(
        'Sentry error reporting is disabled because SENTRY_DSN is not configured.'
      )
      return Layer.empty
    }

    const environment = yield* pipe(
      sentryEnvironmentConfig,
      Effect.flatMap(
        Option.match({
          onNone: () => nodeEnvConfig,
          onSome: Effect.succeed,
        })
      )
    )
    const release = yield* serviceVersionConfig
    const grafanaUrl = yield* grafanaUrlConfig
    const grafanaTempoDatasourceUid = yield* grafanaTempoDatasourceUidConfig

    yield* Effect.sync(() => {
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
    yield* Effect.logInfo('Sentry error reporting enabled', {environment})

    return Layer.merge(
      Logger.layer(
        [makeSentryCaptureLogger(grafanaUrl, grafanaTempoDatasourceUid)],
        {mergeWithExisting: true}
      ),
      Layer.effectDiscard(
        Effect.addFinalizer(() =>
          Effect.promise(async () => {
            await Sentry.close(2000)
          }).pipe(Effect.ignore)
        )
      )
    )
  })
)
