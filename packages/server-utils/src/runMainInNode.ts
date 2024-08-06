import {NodeSdk} from '@effect/opentelemetry'
import {NodeRuntime} from '@effect/platform-node'
import {type RunMain} from '@effect/platform/Runtime'
import {PrometheusExporter} from '@opentelemetry/exporter-prometheus'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {Effect, Layer, Logger} from 'effect'
import {
  isRunningInProductionConfig,
  metricsConfig,
  nodeEnvConfig,
  otlpTraceExporterUrlConfig,
  serviceNameConfig,
  serviceVersionConfig,
} from './commonConfigs'
import {devToolsLayer} from './devToolsLayer'

const logger = isRunningInProductionConfig.pipe(
  Effect.map((inProd) =>
    Logger.replace(
      Logger.defaultLogger,
      inProd
        ? Logger.jsonLogger.pipe(
            Logger.withSpanAnnotations,
            Logger.withConsoleLog
          )
        : Logger.prettyLogger()
    )
  ),
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
        Effect.log('Metrics are disabled because they are not configured.'),
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

export const runMainInNode: RunMain = (effect, options) => {
  NodeRuntime.runMain(
    effect.pipe(
      Effect.catchAll((error) => Effect.logFatal('Error', error)),
      Effect.catchAllDefect((error) => Effect.logFatal('Defect', error)),
      Effect.provide(NodeSdkLive),
      Effect.provide(devToolsLayer(nodeEnvConfig)),
      Effect.provide(logger)
    ),
    options
  )
}
