import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {MapStylesResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, type Option} from 'effect'

const MAP_STYLES_REDIS_KEY = 'CONTENT:mapStyles'
const CACHE_LIFETIME_MILISEC = 1000 * 60 * 60

export interface CacheOperations {
  saveMapStylesToCacheForked: (data: MapStylesResponse) => Effect.Effect<void>

  getMapStylesFromRedis: Effect.Effect<Option.Option<MapStylesResponse>>
}

export class CacheService extends Context.Tag('CacheService')<
  CacheService,
  CacheOperations
>() {
  static readonly Live = Layer.effect(
    CacheService,
    Effect.gen(function* (_) {
      const redisService = yield* _(RedisService)

      const getMapStylesFromRedis = redisService
        .get(MapStylesResponse)(MAP_STYLES_REDIS_KEY)
        .pipe(Effect.option)

      return {
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
        getMapStylesFromRedis,
      }
    })
  )
}
