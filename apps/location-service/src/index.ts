import './sourcemapSupport'

// import {registerSetryMiddleware} from './utils/sentry'
import {NodeSdk} from '@effect/opentelemetry'
import {NodeHttpServer, NodeRuntime} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http'
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-node'
import {
  GetGeocodedCoordinatesRequest,
  GetLocationSuggestionsRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {makeHealthServerLive} from '@vexl-next/server-utils/src/HealthServer'
import {
  AuthenticatedSessionInRequestLive,
  ServerUserSessionConfig,
} from '@vexl-next/server-utils/src/ServerUserSession'
import handleCommonErrorsRouter from '@vexl-next/server-utils/src/handleCommonErrorsRouter'
import {schemaUrlSearchParams} from '@vexl-next/server-utils/src/schemaUrlQuery'
import {Effect, Layer} from 'effect'
import {createServer} from 'http'
import {Environment, EnvironmentConstants} from './EnvironmentLayer'
import googleGeocode from './apis/googleGeocode'
import {querySuggest} from './apis/googleSuggest.js'

const ServerLive = Layer.unwrapEffect(
  EnvironmentConstants.PORT.pipe(
    Effect.map((port) =>
      NodeHttpServer.server.layer(() => createServer(), {port})
    )
  )
)

const HttpLive = Http.router.empty.pipe(
  Http.router.get(
    '/suggest',
    schemaUrlSearchParams(GetLocationSuggestionsRequest).pipe(
      Effect.flatMap(querySuggest),
      Effect.flatMap(Http.response.json),
      Effect.provide(AuthenticatedSessionInRequestLive)
    )
  ),
  Http.router.get(
    '/geocode',
    schemaUrlSearchParams(GetGeocodedCoordinatesRequest).pipe(
      Effect.flatMap(googleGeocode),
      Effect.flatMap(Http.response.json),
      Effect.provide(AuthenticatedSessionInRequestLive)
    )
  ),
  handleCommonErrorsRouter
)

const AppLive = HttpLive.pipe(
  Http.server.serve(Http.middleware.logger),
  Http.server.withLogAddress,
  Layer.provide(ServerLive),
  Layer.provide(
    ServerUserSessionConfig.layerFromEffect(
      EnvironmentConstants.SIGNATURE_PUBLIC_KEY
    )
  ),
  Layer.provide(
    Layer.unwrapEffect(
      EnvironmentConstants.HEALT_PORT.pipe(
        Effect.map((port) => makeHealthServerLive({port}))
      )
    )
  ),
  Layer.provide(Environment.Live)
)
const NodeSdkLive = NodeSdk.layer(() => ({
  resource: {serviceName: 'Notification service'},
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}))

const program = Layer.launch(AppLive).pipe(Effect.provide(NodeSdkLive))
NodeRuntime.runMain(program)
