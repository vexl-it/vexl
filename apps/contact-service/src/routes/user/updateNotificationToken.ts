import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {UpdateNotificationTokenEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {UserDbService} from '../../db/UserDbService'

export const updateNotificationToken = Handler.make(
  UpdateNotificationTokenEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
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
          userDb.updateExpoToken({
            publicKey: security['public-key'],
            hash: security.hash,
            expoToken: Option.fromNullable(req.body.expoToken),
          })
        )
        return {}
      }),
      UserNotFoundError
    )
)
