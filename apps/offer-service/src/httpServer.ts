import {NodeContext} from '@effect/platform-node'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import DbLayer from './db/layer'
import {OfferDbService} from './db/OfferDbService'
import {InternalServerLive} from './internalServer'
import {reportMetricsLayer} from './metrics'
import {createNewOffer} from './routes/createNewOffer'
import {createPrivatePart} from './routes/createPrivatePart'
import {deleteOffer} from './routes/deleteOffer'
import {deletePrivatePart} from './routes/deletePrivatePart'
import {getOffersByIds} from './routes/getOffersByIds'
import {getOffersForMe} from './routes/getOffersForMe'
import {getOffersForMeModifiedOrCreatedAfter} from './routes/getOffersForMeModifiedOrCreatedAfter'
import {getRemovedOffers} from './routes/getRemovedOffers'
import {refreshOffer} from './routes/refreshOffer'
import {reportOffer} from './routes/reportOffer'
import {updateOffer} from './routes/updateOffer'

export const app = RouterBuilder.make(OfferApiSpecification).pipe(
  RouterBuilder.handle(getOffersByIds),
  RouterBuilder.handle(getOffersForMe),
  RouterBuilder.handle(getOffersForMeModifiedOrCreatedAfter),
  RouterBuilder.handle(getRemovedOffers),
  RouterBuilder.handle(reportOffer),
  RouterBuilder.handle(createNewOffer),
  RouterBuilder.handle(refreshOffer),
  RouterBuilder.handle(deleteOffer),
  RouterBuilder.handle(createPrivatePart),
  RouterBuilder.handle(updateOffer),
  RouterBuilder.handle(deletePrivatePart),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.empty.pipe(
  Layer.provideMerge(reportMetricsLayer),
  Layer.provideMerge(InternalServerLive),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(healthServerLayer({port: healthServerPortConfig})),
  Layer.provideMerge(OfferDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(MetricsClientService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
