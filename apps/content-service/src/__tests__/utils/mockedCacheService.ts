import {Effect, Layer, Option} from 'effect'
import {CacheService} from '../../utils/cache'

export const mockedGetMapStylesFromRedis = Effect.succeed(Option.none())
export const mockedSaveMapStylesToCacheForked = jest.fn(() => Effect.void)

export const mockedCacheService = Layer.succeed(CacheService, {
  getMapStylesFromRedis: mockedGetMapStylesFromRedis,
  saveMapStylesToCacheForked: mockedSaveMapStylesToCacheForked,
})
