import * as NodeSdk from '@effect/opentelemetry/NodeSdk'
import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import * as NodeServices from '@effect/platform-node/NodeServices'
import {PrometheusExporter} from '@opentelemetry/exporter-prometheus'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {Effect, Layer, Logger, pipe} from 'effect'
import {type Teardown} from 'effect/Runtime'
import {
  memoryDebugIntervalMsConfig,
  metricsConfig,
  nodeEnvConfig,
  otlpTraceExporterUrlConfig,
  serviceNameConfig,
  serviceVersionConfig,
  useJsonLogsConfig,
} from './commonConfigs'
import {devToolsLayer} from './devToolsLayer'
import {makeMemoryDebugLayer} from './makeMemoryDebugLayer'
import {sentryLayer} from './sentry'

const stringifyCircular = (
  obj: unknown,
  whitespace?: number | string | undefined
): string => {
  try {
    let cache: unknown[] = []
    const retVal = JSON.stringify(
      obj,
      (_key, value) =>
        typeof value === 'object' && value !== null
          ? cache.includes(value)
            ? undefined // circular reference
            : cache.push(value) && value
          : typeof value === 'bigint'
            ? value.toString()
            : value,
      whitespace
    )
    ;(cache as any) = undefined
    return retVal
  } catch (e) {
    return JSON.stringify(`Error while stringifying value to log`)
  }
}

const jsonLoggerThatHandlesUnserializableValues = Logger.map(
  Logger.formatStructured,
  stringifyCircular
)

const logger = useJsonLogsConfig.pipe(
  Effect.map((useJson) =>
    Logger.layer([
      useJson
        ? jsonLoggerThatHandlesUnserializableValues.pipe(Logger.withConsoleLog)
        : Logger.consolePretty(),
    ])
  ),
  Layer.unwrap
)

const memoryDebugLayer = memoryDebugIntervalMsConfig.pipe(
  Effect.flatMap(Effect.fromOption),
  Effect.map((interval) => makeMemoryDebugLayer(interval)),
  Effect.catchTag('NoSuchElementError', () => Effect.succeed(Layer.empty)),
  Layer.unwrap
)

const NodeSdkLive = Effect.gen(function* () {
  const serviceName = yield* serviceNameConfig
  const serviceVersion = yield* serviceVersionConfig

  yield* Effect.logInfo('Configuring service', {serviceName, serviceVersion})

  const spanProcessor = yield* pipe(
    otlpTraceExporterUrlConfig.pipe(Effect.flatMap(Effect.fromOption)),
    Effect.tap((metricsConfiguration) =>
      Effect.logInfo('Configuring span processor', metricsConfiguration)
    ),
    Effect.map(
      (otlpTraceExporterUrl) =>
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: otlpTraceExporterUrl,
          })
        )
    ),
    Effect.catchTag('NoSuchElementError', (e) =>
      Effect.andThen(
        Effect.log('Spans are disabled because they are not configured.'),
        Effect.succeed(undefined)
      )
    )
  )

  const metricsReader = yield* pipe(
    metricsConfig.pipe(Effect.flatMap(Effect.fromOption)),
    Effect.tap((metricsConfiguration) =>
      Effect.logInfo('Configuring metrics', metricsConfiguration)
    ),
    Effect.map(
      ({prometheusEndpoint, prometheusPort}) =>
        new PrometheusExporter({
          port: prometheusPort,
          endpoint: prometheusEndpoint,
        })
    ),
    Effect.catchTag('NoSuchElementError', (e) =>
      Effect.andThen(
        Effect.log(
          'Prometheus metrics are disabled because they are not configured.'
        ),
        Effect.succeed(undefined)
      )
    )
  )

  return NodeSdk.layer(() => ({
    resource: {serviceName, serviceVersion},
    spanProcessor,
    metricReader: metricsReader,
  }))
}).pipe(Layer.unwrap)

export const runMainInNode = <A, E>(
  effectOrLayer:
    | Effect.Effect<A, E, NodeServices.NodeServices>
    | Layer.Layer<A, E, NodeServices.NodeServices>,
  options?: {
    readonly disableErrorReporting?: boolean | undefined
    readonly teardown?: Teardown | undefined
  }
): void => {
  NodeRuntime.runMain(
    (Effect.isEffect(effectOrLayer)
      ? effectOrLayer
      : Layer.launch(effectOrLayer)
    ).pipe(
      Effect.catch((error) =>
        Effect.andThen(
          Effect.sync(() => {
            console.error('App fatal error:', error)
          }),
          Effect.logFatal('Error', error)
        )
      ),
      Effect.catchDefect((error) => {
        console.error('Fatal defect:', error)
        return Effect.logError('Defect', error)
      }),
      Effect.provide(memoryDebugLayer),
      Effect.provide(NodeSdkLive),
      Effect.provide(devToolsLayer(nodeEnvConfig)),
      Effect.provide(
        options?.disableErrorReporting === true ? Layer.empty : sentryLayer
      ),
      Effect.provide(logger),
      Effect.provide(NodeServices.layer)
    ),
    {teardown: options?.teardown}
  )
}
