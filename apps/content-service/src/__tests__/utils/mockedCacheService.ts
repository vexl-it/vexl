import {Effect, Layer, Option} from 'effect'
import {CacheService} from '../../utils/cache'

export const mockedGetMapStylesFromRedis = Effect.succeed(Option.none())
export const mockedClearCache = Effect.void
export const mockedSaveMapStylesToCacheForked = jest.fn(() => Effect.void)

export const mockedCacheService = Layer.succeed(CacheService, {
  getMapStylesFromRedis: mockedGetMapStylesFromRedis,
  clearCache: mockedClearCache,
  saveMapStylesToCacheForked: mockedSaveMapStylesToCacheForked,
})
