import {MetricsServiceSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {Effect} from 'effect/index'
import {portConfig} from './configs'
import {reportNotificationInteraction} from './routes/reportNotificationInteraction'

export const app = RouterBuilder.make(MetricsServiceSpecification).pipe(
  RouterBuilder.handle(reportNotificationInteraction),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

export const httpServerEffect = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app))
)
