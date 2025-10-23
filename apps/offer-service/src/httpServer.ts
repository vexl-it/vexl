import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {createChallenge} from '@vexl-next/server-utils/src/services/challenge/routes/createChalenge'
import {createChallenges} from '@vexl-next/server-utils/src/services/challenge/routes/createChallenges'
import {Layer} from 'effect'
import {cryptoConfig, healthServerPortConfig, redisUrl} from './configs'
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

const RootGroupLive = HttpApiBuilder.group(OfferApiSpecification, 'root', (h) =>
  h
    .handle('createNewOffer', createNewOffer)
    .handle('createPrivatePart', createPrivatePart)
    .handle('deleteOffer', deleteOffer)
    .handle('deletePrivatePart', deletePrivatePart)
    .handle('getClubOffersByIds', getClubOffersByIds)
    .handle(
      'getClubOffersForMeModifiedOrCreatedAfter',
      getClubOffersForMeModifiedOrCreatedAfter
    )
    .handle('getOffersByIds', getOffersByIds)
    .handle(
      'getOffersForMeModifiedOrCreatedAfter',
      getOffersForMeModifiedOrCreatedAfter
    )
    .handle('getRemovedClubOffers', getRemovedClubOffers)
    .handle('getRemovedOffers', getRemovedOffers)
    .handle('reportClubOffer', reportClubOffer)
    .handle('reportOffer', reportOffer)
    .handle('refreshOffer', refreshOffer)
    .handle('updateOffer', updateOffer)
)

const ChallengeApiGroupLive = HttpApiBuilder.group(
  OfferApiSpecification,
  'Challenges',
  (h) =>
    h
      .handle('createChallenge', createChallenge)
      .handle('createChallengeBatch', createChallenges)
)

export const OfferApiLive = HttpApiBuilder.api(OfferApiSpecification).pipe(
  Layer.provide(RootGroupLive),
  Layer.provide(ChallengeApiGroupLive),
  Layer.provide(ServerSecurityMiddlewareLive)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(OfferApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const HttpServerLive = Layer.empty.pipe(
  Layer.provideMerge(ApiServerLive),
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
  Layer.provideMerge(RedisConnectionService.layer(redisUrl))
)
