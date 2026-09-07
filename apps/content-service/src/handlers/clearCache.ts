import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {InvalidTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, flow, pipe} from 'effect'
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

export const clearCacheHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'Cms',
  'clearCache',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      yield* pipe(
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
