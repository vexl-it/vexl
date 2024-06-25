import './sourcemapSupport'

// import {registerSetryMiddleware} from './utils/sentry'
import {DevTools} from '@effect/experimental'
import {
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from '@effect/platform'
import {NodeHttpServer, NodeRuntime} from '@effect/platform-node'
import {
  GetExchangeRateRequest,
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
import {YadioCache, getExchangeRatePrice} from './apis/yadio'

const ServerLive = Layer.unwrapEffect(
  EnvironmentConstants.PORT.pipe(
    Effect.map((port) => NodeHttpServer.layer(() => createServer(), {port}))
  )
)

const HttpLive = HttpRouter.empty.pipe(
  HttpRouter.get(
    '/suggest',
    schemaUrlSearchParams(GetLocationSuggestionsRequest).pipe(
      Effect.flatMap(querySuggest),
      Effect.flatMap(HttpServerResponse.json),
      Effect.provide(AuthenticatedSessionInRequestLive)
    )
  ),
  HttpRouter.get(
    '/geocode',
    schemaUrlSearchParams(GetGeocodedCoordinatesRequest).pipe(
      Effect.flatMap(googleGeocode),
      Effect.flatMap(HttpServerResponse.json),
      Effect.provide(AuthenticatedSessionInRequestLive)
    )
  ),
  HttpRouter.get(
    '/btc-rate',
    schemaUrlSearchParams(GetExchangeRateRequest).pipe(
      Effect.flatMap(getExchangeRatePrice),
      Effect.flatMap(HttpServerResponse.json),
      Effect.provide(AuthenticatedSessionInRequestLive),
      Effect.catchTag('GetExchangeRateError', (e) =>
        HttpServerResponse.json(e, {status: 400})
      )
    )
  ),
  handleCommonErrorsRouter
)

const AppLive = HttpLive.pipe(
  HttpServer.serve(HttpMiddleware.logger),
  HttpServer.withLogAddress,
  Layer.provide(ServerLive),
  Layer.provide(YadioCache.layer()),
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
// .pipe(Effect.provide(NodeSdkLive))
NodeRuntime.runMain(program)
