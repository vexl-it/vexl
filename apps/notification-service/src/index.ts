import {DevTools} from '@effect/experimental'
import {NodeSdk} from '@effect/opentelemetry'
import {NodeHttpServer, NodeRuntime} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-node'
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
  Http.router.catchAll((e) => {
    switch (e._tag) {
      case 'InvalidSessionError':
        return Http.response.json(e, {status: 401})
      case 'BodyError':
        return Http.response.text('Internal server error (Body error)', {
          status: 500,
        })
      case 'ParseError':
        return Http.response.json({message: e.message}, {status: 400})
      case 'RequestError':
        return Http.response.json({message: e.message, status: 400})
      //  ! Default case is not handled on purpose !
      // If this is linted, first consider adding the error to specific route
      // only errors that are general enough should be handled here (not errors
      // specific for one route)
    }
  })
)

const AppLive = HttpLive.pipe(
  Http.server.serve(Http.middleware.logger),
  Http.server.withLogAddress,
  Layer.provide(ServerLive),
  Layer.provide(FirebaseMessagingLayer.Live),
  Layer.provide(Environment.Live),
  Layer.provide(DevTools.layer())
)

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: {serviceName: 'Notification service'},
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}))

const program = Layer.launch(AppLive).pipe(Effect.provide(NodeSdkLive))
NodeRuntime.runMain(program)
