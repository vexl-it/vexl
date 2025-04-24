import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  ClearEventsCacheErrors,
  InvalidTokenError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ClearEventsCacheEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, flow} from 'effect'
import {Handler} from 'effect-http'
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

export const clearCacheHandler = Handler.make(ClearEventsCacheEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.query.token))

      yield* _(
        CacheService,
        Effect.flatMap((c) => c.clearCache)
      )

      return null
    }).pipe(
      Effect.mapError((e) => {
        if (e._tag === 'InvalidTokenError') return e
        return new UnexpectedServerError({cause: e, status: 500})
      }),
      Effect.withSpan('clearCache')
    ),
    ClearEventsCacheErrors
  )
)
