import {NodeSdk} from '@effect/opentelemetry'
import {NodeContext, NodeRuntime} from '@effect/platform-node'
import {type Teardown} from '@effect/platform/Runtime'
import {PrometheusExporter} from '@opentelemetry/exporter-prometheus'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {Effect, Layer, Logger} from 'effect'
import {
  isRunningInProductionConfig,
  memoryDebugIntervalMsConfig,
  metricsConfig,
  nodeEnvConfig,
  otlpTraceExporterUrlConfig,
  serviceNameConfig,
  serviceVersionConfig,
} from './commonConfigs'
import {devToolsLayer} from './devToolsLayer'
import {makeMemoryDebugLayer} from './makeMemoryDebugLayer'

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
  Logger.structuredLogger,
  stringifyCircular
)

const logger = isRunningInProductionConfig.pipe(
  Effect.map((inProd) =>
    Logger.replace(
      Logger.defaultLogger,
      inProd
        ? jsonLoggerThatHandlesUnserializableValues.pipe(
            Logger.withSpanAnnotations,
            Logger.withConsoleLog
          )
        : Logger.prettyLogger()
    )
  ),
  Layer.unwrapEffect
)

const memoryDebugLayer = memoryDebugIntervalMsConfig.pipe(
  Effect.flatten,
  Effect.map((interval) => makeMemoryDebugLayer(interval)),
  Effect.catchTag('NoSuchElementException', () => Effect.succeed(Layer.empty)),
  Layer.unwrapEffect
)

const NodeSdkLive = Effect.gen(function* (_) {
  const serviceName = yield* _(serviceNameConfig)
  const serviceVersion = yield* _(serviceVersionConfig)

  yield* _(Effect.logInfo('Configuring service', {serviceName, serviceVersion}))

  const spanProcessor = yield* _(
    Effect.flatten(otlpTraceExporterUrlConfig),
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
    Effect.catchTag('NoSuchElementException', (e) =>
      Effect.zipRight(
        Effect.log('Spans are disabled because they are not configured.'),
        Effect.succeed(undefined)
      )
    )
  )

  const metricsReader = yield* _(
    Effect.flatten(metricsConfig),
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
    Effect.catchTag('NoSuchElementException', (e) =>
      Effect.zipRight(
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
}).pipe(Layer.unwrapEffect)

export const runMainInNode = <A, E>(
  effectOrLayer:
    | Effect.Effect<A, E, NodeContext.NodeContext>
    | Layer.Layer<A, E, NodeContext.NodeContext>,
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
      Effect.catchAll((error) => Effect.logFatal('Error', error)),
      Effect.catchAllDefect((error) => Effect.logFatal('Defect', error)),
      Effect.provide(memoryDebugLayer),
      Effect.provide(NodeSdkLive),
      Effect.provide(devToolsLayer(nodeEnvConfig)),
      Effect.provide(logger),
      Effect.provide(NodeContext.layer)
    ),
    {disablePrettyLogger: true}
  )
}
