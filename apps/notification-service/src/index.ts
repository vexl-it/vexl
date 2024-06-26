import {DevTools} from '@effect/experimental'
import {HttpMiddleware, HttpRouter, HttpServer} from '@effect/platform'
import {NodeHttpServer, NodeRuntime} from '@effect/platform-node'
import * as HealthServer from '@vexl-next/server-utils/src/HealthServer'
import {ServerUserSessionConfig} from '@vexl-next/server-utils/src/ServerUserSession'
import handleCommonErrorsRouter from '@vexl-next/server-utils/src/handleCommonErrorsRouter'
import {Effect, Layer} from 'effect'
import {createServer} from 'http'
import {Environment, EnvironmentConstants} from './EnvironmentLayer'
import {FirebaseMessagingLayer} from './FirebaseMessagingLayer'
import GetKeyRouteLive from './routes/GetkeyRouteLive'
import IssueNotificationRouteLive from './routes/IssueNotificationRouteLive'

const ServerLive = Layer.unwrapEffect(
  Effect.gen(function* (_) {
    const port = yield* _(EnvironmentConstants.PORT)
    return NodeHttpServer.layer(() => createServer(), {port})
  })
)

const HttpLive = HttpRouter.empty.pipe(
  GetKeyRouteLive,
  IssueNotificationRouteLive,
  handleCommonErrorsRouter
)

const HealthServerLive = Layer.unwrapEffect(
  EnvironmentConstants.HEALTH_PORT.pipe(
    Effect.map((port) => HealthServer.makeHealthServerLive({port}))
  )
)

const AppLive = HttpLive.pipe(
  HttpServer.serve(HttpMiddleware.logger),
  HttpServer.withLogAddress,
  Layer.provide(ServerLive),
  Layer.provide(HealthServerLive),
  Layer.provide(FirebaseMessagingLayer.Live),
  Layer.provide(
    Layer.effect(
      ServerUserSessionConfig,
      EnvironmentConstants.SIGNATURE_PUBLIC_KEY.pipe(
        Effect.map((secretKey) => ({secretPublicKey: secretKey}))
      )
    )
  ),
  Layer.provide(
    Layer.unwrapEffect(
      EnvironmentConstants.ENV.pipe(
        Effect.flatMap((env) => {
          if (env === 'development') {
            return Effect.zipRight(
              Effect.log(
                'I am in development environment, registering dev tools'
              ),
              Effect.succeed(DevTools.layer())
            )
          } else {
            return Effect.zipRight(
              Effect.log(
                'I am NOT in development environment, NOT registering dev tools'
              ),
              Effect.succeed(Layer.empty)
            )
          }
        })
      )
    )
  ),
  Layer.provide(Environment.Live)
)

// const NodeSdkLive = NodeSdk.layer(() => ({
//   resource: {serviceName: 'Notification service'},
//   spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
// }))

const program = Layer.launch(AppLive).pipe(
  Effect.catchAllCause(Effect.logError)
)
NodeRuntime.runMain(program)
