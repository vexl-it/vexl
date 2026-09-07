import {FeedbackApiSpecification} from '@vexl-next/rest-api/src/services/feedback/specification'
import {redisUrl} from '@vexl-next/server-utils/src/commonConfigs'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {Layer} from 'effect'
import {HttpRouter} from 'effect/unstable/http'
import {HttpApiBuilder, HttpApiSwagger} from 'effect/unstable/httpapi'
import {cryptoConfig, healthServerPortConfig} from './configs'
import DbLayer from './db/layer'
import {submitFeedbackHandler} from './routes/submitFeedback'
import {FeedbackDbService} from './routes/submitFeedback/db'

const FeedbackLive = HttpApiBuilder.group(
  FeedbackApiSpecification,
  'root',
  (h) => h.handle('submitFeedback', submitFeedbackHandler)
)

export const ApiLive = HttpApiBuilder.layer(FeedbackApiSpecification).pipe(
  Layer.provide(FeedbackLive),
  Layer.provide(ServerSecurityMiddlewareLive),
  Layer.provide(rateLimitingMiddlewareLayer(FeedbackApiSpecification))
)

const ApiServerLive = HttpRouter.serve(
  Layer.mergeAll(ApiLive, HttpApiSwagger.layer(FeedbackApiSpecification))
).pipe(Layer.provide(NodeHttpServerLiveWithPortFromEnv))

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(FeedbackDbService.Live),
  Layer.provideMerge(DbLayer)
)
