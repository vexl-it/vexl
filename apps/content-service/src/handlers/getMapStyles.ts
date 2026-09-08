import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option} from 'effect'
import {CacheService} from '../utils/cache'
import {MapStylesService} from '../utils/mapStyles'

export const getMapStylesHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'Map',
  'getMapStyles',
  () =>
    Effect.gen(function* () {
      const cache = yield* CacheService

      const cached = yield* cache.getMapStylesFromRedis
      if (Option.isSome(cached)) return cached.value

      const mapStylesService = yield* MapStylesService
      const response = yield* mapStylesService.fetchMapStyles()

      yield* cache.saveMapStylesToCacheForked(response)

      return response
    }).pipe(
      Effect.catch(
        (e) =>
          new UnexpectedServerError({
            cause: e,
            status: 500,
          })
      ),
      Effect.withSpan('getMapStyles'),
      makeEndpointEffect
    )
)
