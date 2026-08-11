import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  BlogsArticlesResponse,
  EventsResponse,
  MapStylesResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  type RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, type Option} from 'effect'

const EVENTS_REDIS_KEY = 'CONTENT:events'
const BLOGS_REDIS_KEY = 'CONTENT:blogs'
const MAP_STYLES_REDIS_KEY = 'CONTENT:mapStyles'
const CACHE_LIFETIME_MILISEC = 1000 * 60 * 60

export interface CacheOperations {
  saveEventsToCacheForked: (data: EventsResponse) => Effect.Effect<void>
  saveBlogsToCacheForked: (data: BlogsArticlesResponse) => Effect.Effect<void>
  saveMapStylesToCacheForked: (data: MapStylesResponse) => Effect.Effect<void>

  getEventsFromRedis: Effect.Effect<Option.Option<EventsResponse>>
  getBlogsFromRedis: Effect.Effect<Option.Option<BlogsArticlesResponse>>
  getMapStylesFromRedis: Effect.Effect<Option.Option<MapStylesResponse>>

  clearCache: Effect.Effect<void, RedisError>
}

export class CacheService extends Context.Tag('CacheService')<
  CacheService,
  CacheOperations
>() {
  static readonly Live = Layer.effect(
    CacheService,
    Effect.gen(function* (_) {
      const redisService = yield* _(RedisService)

      const getEventsFromRedis = redisService
        .get(EventsResponse)(EVENTS_REDIS_KEY)
        .pipe(Effect.option)

      const getBlogsFromRedis = redisService
        .get(BlogsArticlesResponse)(BLOGS_REDIS_KEY)
        .pipe(Effect.option)

      const getMapStylesFromRedis = redisService
        .get(MapStylesResponse)(MAP_STYLES_REDIS_KEY)
        .pipe(Effect.option)

      return {
        saveEventsToCacheForked: (data) =>
          redisService
            .set(EventsResponse)(EVENTS_REDIS_KEY, data, {
              expiresAt: unixMillisecondsFromNow(CACHE_LIFETIME_MILISEC),
            })
            .pipe(
              Effect.tapError((e) =>
                Effect.logWarning('Failed to save events to cache', e)
              ),
              Effect.withSpan('saveEventsToRedis'),
              Effect.forkDaemon,
              Effect.ignore
            ),
        saveBlogsToCacheForked: (data) =>
          redisService
            .set(BlogsArticlesResponse)(BLOGS_REDIS_KEY, data, {
              expiresAt: unixMillisecondsFromNow(CACHE_LIFETIME_MILISEC),
            })
            .pipe(
              Effect.tapError((e) =>
                Effect.logWarning('Failed to save blogs to cache', e)
              ),
              Effect.withSpan('saveBlogsToRedis'),
              Effect.forkDaemon,
              Effect.ignore
            ),
        saveMapStylesToCacheForked: (data) =>
          redisService
            .set(MapStylesResponse)(MAP_STYLES_REDIS_KEY, data, {
              expiresAt: unixMillisecondsFromNow(CACHE_LIFETIME_MILISEC),
            })
            .pipe(
              Effect.withSpan('saveMapStylesToRedis'),
              Effect.forkDaemon,
              Effect.ignore
            ),
        getEventsFromRedis,
        getBlogsFromRedis,
        getMapStylesFromRedis,

        clearCache: Effect.all(
          [
            redisService.delete(EVENTS_REDIS_KEY),
            redisService.delete(BLOGS_REDIS_KEY),
            redisService.delete(MAP_STYLES_REDIS_KEY),
          ],
          {discard: true}
        ),
      }
    })
  )
}
