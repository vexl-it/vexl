import {NodeContext} from '@effect/platform-node'
import {FeedbackApiSpecification} from '@vexl-next/rest-api/src/services/feedback/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {cryptoConfig, healthServerPortConfig, portConfig} from './configs'
import DbLayer from './db/layer'
import {submitFeedbackHandler} from './routes/submitFeedback'
import {FeedbackDbService} from './routes/submitFeedback/db'

export const app = RouterBuilder.make(FeedbackApiSpecification).pipe(
  RouterBuilder.handle(submitFeedbackHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  FeedbackDbService.Live,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(Layer.provideMerge(DbLayer), Layer.provideMerge(NodeContext.layer))

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
