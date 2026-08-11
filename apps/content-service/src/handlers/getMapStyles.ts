import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {CacheService} from '../utils/cache'
import {MapStylesService} from '../utils/mapStyles'

export const getMapStylesHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Map',
  'getMapStyles',
  () =>
    Effect.gen(function* (_) {
      const cache = yield* _(CacheService)

      const cached = yield* _(cache.getMapStylesFromRedis)
      if (Option.isSome(cached)) return cached.value

      const mapStylesService = yield* _(MapStylesService)
      const response = yield* _(mapStylesService.fetchMapStyles())

      yield* _(cache.saveMapStylesToCacheForked(response))

      return response
    }).pipe(
      Effect.catchAll(
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
