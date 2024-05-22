import {DevTools} from '@effect/experimental'
import {NodeHttpServer, NodeRuntime} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
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
    return NodeHttpServer.server.layer(() => createServer(), {port})
  })
)

const HttpLive = Http.router.empty.pipe(
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
  Http.server.serve(Http.middleware.logger),
  Http.server.withLogAddress,
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
