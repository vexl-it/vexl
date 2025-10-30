import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {redisUrl} from '@vexl-next/server-utils/src/commonConfigs'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Layer} from 'effect'
import {cryptoConfig, healthServerPortConfig} from './configs'
import {getBlogsHandler} from './handlers/blog'
import {clearCacheHandler} from './handlers/clearCache'
import {createInvoiceHandler} from './handlers/donations/createInvoice'
import {getInvoiceHandler} from './handlers/donations/getInvoice'

import {getInvoiceStatusTypeHandler} from './handlers/donations/getInvoiceStatusType'
import {updateInvoiceStateWebhook} from './handlers/donations/updateInvoiceStateWebhook'
import {UpdateInvoiceStateWebhookService} from './handlers/donations/UpdateInvoiceStateWebhookService'
import {getEventsHandler} from './handlers/events'
import {newsAndAnonouncementsHandler} from './handlers/getNewsAndAnnonuncements'
import {CacheService} from './utils/cache'
import {BtcPayServerService} from './utils/donations'
import {WebflowCmsService} from './utils/webflowCms'

const CmsApiGroupLive = HttpApiBuilder.group(
  ContentApiSpecification,
  'Cms',
  (h) =>
    h
      .handle('getEvents', getEventsHandler)
      .handle('clearCache', clearCacheHandler)
      .handle('getBlogArticles', getBlogsHandler)
)

const NewsAndAnnouncementsApiGroupLive = HttpApiBuilder.group(
  ContentApiSpecification,
  'NewsAndAnnouncements',
  (h) => h.handle('getNewsAndAnnouncements', newsAndAnonouncementsHandler)
)

const DonationsApiGroupLive = HttpApiBuilder.group(
  ContentApiSpecification,
  'Donations',
  (h) =>
    h
      .handle('createInvoice', createInvoiceHandler)
      .handle('getInvoice', getInvoiceHandler)
      .handle('updateInvoiceStateWebhook', updateInvoiceStateWebhook)
      .handle('getInvoiceStatusType', getInvoiceStatusTypeHandler)
)

export const ContentApiLive = HttpApiBuilder.api(ContentApiSpecification).pipe(
  Layer.provide(CmsApiGroupLive),
  Layer.provide(NewsAndAnnouncementsApiGroupLive),
  Layer.provide(DonationsApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(ContentApiSpecification))
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ContentApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(WebflowCmsService.Live),
  Layer.provideMerge(CacheService.Live),
  Layer.provideMerge(UpdateInvoiceStateWebhookService.Live),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(BtcPayServerService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl))
)
