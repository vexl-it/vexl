import {NodeSdk} from '@effect/opentelemetry'
import {NodeRuntime} from '@effect/platform-node'
import {type RunMain} from '@effect/platform/Runtime'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {Effect, Layer, Logger, Option} from 'effect'
import {
  isRunningInProductionConfig,
  nodeEnvConfig,
  tracingConfig,
} from './commonConfigs'
import {devToolsLayer} from './devToolsLayer'

const logger = isRunningInProductionConfig.pipe(
  Effect.map((inProd) => (inProd ? Logger.json : Logger.pretty)),
  Layer.unwrapEffect
)

const NodeSdkLive = Effect.gen(function* (_) {
  const tracingConfigOption = yield* _(tracingConfig)
  if (Option.isNone(tracingConfigOption)) {
    yield* _(
      Effect.logInfo('Tracing is disabled because it is not configured.')
    )
    return Layer.empty
  }

  const {serviceName, otlpTraceExporterUrl} = tracingConfigOption.value
  yield* _(
    Effect.logInfo('Configuring tracing', {serviceName, otlpTraceExporterUrl})
  )

  return NodeSdk.layer(() => ({
    resource: {serviceName},
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: otlpTraceExporterUrl,
      })
    ),
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
