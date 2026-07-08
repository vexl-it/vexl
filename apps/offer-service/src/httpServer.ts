import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {createChallenge} from '@vexl-next/server-utils/src/services/challenge/routes/createChalenge'
import {createChallenges} from '@vexl-next/server-utils/src/services/challenge/routes/createChallenges'
import {Layer} from 'effect'
import {CleanupWorkersLayer} from './cleanupWorkers'
import {cryptoConfig, healthServerPortConfig, redisUrl} from './configs'
import {NoteDbService} from './db/NoteDbService'
import {OfferDbService} from './db/OfferDbService'
import DbLayer from './db/layer'
import {reportMetricsLayer} from './metrics'
import {createNewOffer} from './routes/createNewOffer'
import {createPrivatePart} from './routes/createPrivatePart'
import {deleteOffer} from './routes/deleteOffer'
import {deletePrivatePart} from './routes/deletePrivatePart'
import {getClubOffersForMeModifiedOrCreatedAfterPaginated} from './routes/getClubOffersForMeModifiedOrCreatedAfterPaginated'
import {getOffersForMeModifiedOrCreatedAfterPaginated} from './routes/getOffersForMeModifiedOrCreatedAfterPaginated'
import {getRemovedClubOffers} from './routes/getRemovedClubOffers'
import {getRemovedOffers} from './routes/getRemovedOffers'
import {createNewNote} from './routes/notes/createNewNote'
import {createNotePrivatePart} from './routes/notes/createNotePrivatePart'
import {createRepostNotePrivatePart} from './routes/notes/createRepostNotePrivatePart'
import {deleteNote} from './routes/notes/deleteNote'
import {deleteNotePrivatePart} from './routes/notes/deleteNotePrivatePart'
import {getNotesForMeModifiedOrCreatedAfterPaginated} from './routes/notes/getNotesForMeModifiedOrCreatedAfterPaginated'
import {getRemovedNotes} from './routes/notes/getRemovedNotes'
import {reportNote} from './routes/notes/reportNote'
import {repostNote} from './routes/notes/repostNote'
import {undoRepostNote} from './routes/notes/undoRepostNote'
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
    .handle('getRemovedClubOffers', getRemovedClubOffers)
    .handle('getRemovedOffers', getRemovedOffers)
    .handle('reportClubOffer', reportClubOffer)
    .handle('reportOffer', reportOffer)
    .handle('refreshOffer', refreshOffer)
    .handle('updateOffer', updateOffer)
    .handle(
      'getOffersForMeModifiedOrCreatedAfterPaginated',
      getOffersForMeModifiedOrCreatedAfterPaginated
    )
    .handle(
      'getClubOffersForMeModifiedOrCreatedAfterPaginated',
      getClubOffersForMeModifiedOrCreatedAfterPaginated
    )
)

const ChallengeApiGroupLive = HttpApiBuilder.group(
  OfferApiSpecification,
  'Challenges',
  (h) =>
    h
      .handle('createChallenge', createChallenge)
      .handle('createChallengeBatch', createChallenges)
)

const NotesApiGroupLive = HttpApiBuilder.group(
  OfferApiSpecification,
  'Notes',
  (h) =>
    h
      .handle('createNewNote', createNewNote)
      .handle('createNotePrivatePart', createNotePrivatePart)
      .handle('deleteNotePrivatePart', deleteNotePrivatePart)
      .handle('createRepostNotePrivatePart', createRepostNotePrivatePart)
      .handle('deleteNote', deleteNote)
      .handle('repostNote', repostNote)
      .handle('undoRepostNote', undoRepostNote)
      .handle(
        'getNotesForMeModifiedOrCreatedAfterPaginated',
        getNotesForMeModifiedOrCreatedAfterPaginated
      )
      .handle('getRemovedNotes', getRemovedNotes)
      .handle('reportNote', reportNote)
)

export const OfferApiLive = HttpApiBuilder.api(OfferApiSpecification).pipe(
  Layer.provide(RootGroupLive),
  Layer.provide(ChallengeApiGroupLive),
  Layer.provide(NotesApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(OfferApiSpecification)),
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
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(CleanupWorkersLayer),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(healthServerLayer({port: healthServerPortConfig})),
  Layer.provideMerge(OfferDbService.Live),
  Layer.provideMerge(NoteDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl))
)
