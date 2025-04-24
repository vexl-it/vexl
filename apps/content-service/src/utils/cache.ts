import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  BlogsArticlesResponse,
  EventsResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  type RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, type Option} from 'effect'

const EVENTS_REDIS_KEY = 'CONTENT:events'
const BLOGS_REDIS_KEY = 'CONTENT:blogs'
const CACHE_LIFETIME_MILISEC = 1000 * 60 * 60 * 24

export interface CacheOperations {
  saveEventsToCacheForked: (data: EventsResponse) => Effect.Effect<void>
  saveBlogsToCacheForked: (data: BlogsArticlesResponse) => Effect.Effect<void>

  getEventsFromRedis: Effect.Effect<Option.Option<EventsResponse>>
  getBlogsFromRedis: Effect.Effect<Option.Option<BlogsArticlesResponse>>

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

      return {
        saveEventsToCacheForked: (data) =>
          redisService
            .set(EventsResponse)(EVENTS_REDIS_KEY, data, {
              expiresAt: unixMillisecondsFromNow(CACHE_LIFETIME_MILISEC),
            })
            .pipe(
              Effect.withSpan('saveEventsToRedis', {
                attributes: {events: data},
              }),
              Effect.forkDaemon,
              Effect.ignore
            ),
        saveBlogsToCacheForked: (data) =>
          redisService
            .set(BlogsArticlesResponse)(BLOGS_REDIS_KEY, data, {
              expiresAt: unixMillisecondsFromNow(CACHE_LIFETIME_MILISEC),
            })
            .pipe(
              Effect.withSpan('saveBlogsToRedis', {
                attributes: {blogs: data},
              }),
              Effect.forkDaemon,
              Effect.ignore
            ),
        getEventsFromRedis,
        getBlogsFromRedis,

        clearCache: Effect.zip(
          redisService.delete(EVENTS_REDIS_KEY),
          redisService.delete(BLOGS_REDIS_KEY)
        ),
      }
    })
  )
}
