import {NodeContext} from '@effect/platform-node'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {createChallenge} from '@vexl-next/server-utils/src/services/challenge/routes/createChalenge'
import {createChallenges} from '@vexl-next/server-utils/src/services/challenge/routes/createChallenges'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import {OfferDbService} from './db/OfferDbService'
import DbLayer from './db/layer'
import {InternalServerLive} from './internalServer'
import {reportMetricsLayer} from './metrics'
import {createNewOffer} from './routes/createNewOffer'
import {createPrivatePart} from './routes/createPrivatePart'
import {deleteOffer} from './routes/deleteOffer'
import {deletePrivatePart} from './routes/deletePrivatePart'
import {getClubOffersByIds} from './routes/getClubOffersByIds'
import {getClubOffersForMeModifiedOrCreatedAfter} from './routes/getClubOffersForMeModifiedOrCreatedAfter'
import {getOffersByIds} from './routes/getOffersByIds'
import {getOffersForMeModifiedOrCreatedAfter} from './routes/getOffersForMeModifiedOrCreatedAfter'
import {getRemovedClubOffers} from './routes/getRemovedClubOffers'
import {getRemovedOffers} from './routes/getRemovedOffers'
import {refreshOffer} from './routes/refreshOffer'
import {reportClubOffer} from './routes/reportClubOffer'
import {reportOffer} from './routes/reportOffer'
import {updateOffer} from './routes/updateOffer'

export const app = RouterBuilder.make(OfferApiSpecification).pipe(
  // challenges
  RouterBuilder.handle(createChallenge),
  RouterBuilder.handle(createChallenges),
  // offers
  RouterBuilder.handle(getOffersByIds),
  RouterBuilder.handle(getClubOffersByIds),
  RouterBuilder.handle(getOffersForMeModifiedOrCreatedAfter),
  RouterBuilder.handle(getClubOffersForMeModifiedOrCreatedAfter),
  RouterBuilder.handle(getRemovedOffers),
  RouterBuilder.handle(getRemovedClubOffers),
  RouterBuilder.handle(reportOffer),
  RouterBuilder.handle(reportClubOffer),
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
  Layer.provideMerge(ChallengeService.Live),
  Layer.provideMerge(ChallengeDbService.Live),
  Layer.provideMerge(healthServerLayer({port: healthServerPortConfig})),
  Layer.provideMerge(OfferDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
