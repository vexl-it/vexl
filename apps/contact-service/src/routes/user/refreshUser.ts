import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {RefreshUserEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {UserDbService} from '../../db/UserDbService'
import {reportUserRefresh} from '../../metrics'

export const refreshUser = Handler.make(RefreshUserEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(reportUserRefresh())
      const userDb = yield* _(UserDbService)
      yield* _(
        userDb.findUserByPublicKeyAndHash({
          hash: security.hash,
          publicKey: security['public-key'],
        }),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () =>
          Effect.fail(new UserNotFoundError())
        )
      )

      yield* _(
        userDb.updateRefreshUser({
          publicKey: security['public-key'],
          hash: security.hash,
          clientVersion: req.headers.clientVersionOrNone,
          refreshedAt: new Date(),
        })
      )
    }),
    UserNotFoundError
  )
)
