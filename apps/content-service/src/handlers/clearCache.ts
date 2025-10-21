import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, flow} from 'effect'
import {clearCacheTokenHashConfig} from '../configs'
import {CacheService} from '../utils/cache'

const validateAdminToken = flow(
  hashSha256,
  Effect.zip(clearCacheTokenHashConfig),
  Effect.filterOrFail(
    ([receivedTokenHash, expectedTokenHash]) =>
      receivedTokenHash === expectedTokenHash,
    () => new InvalidTokenError({status: 401})
  ),
  Effect.map(([a]) => a)
)

export const clearCacheHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'clearCache',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.urlParams.token))

      yield* _(
        CacheService,
        Effect.flatMap((c) => c.clearCache)
      )
      return {}
    }).pipe(
      Effect.mapError((e) => {
        if (e._tag === 'InvalidTokenError') return e
        return new UnexpectedServerError({cause: e, status: 500})
      }),
      Effect.withSpan('clearCache'),
      makeEndpointEffect
    )
)
