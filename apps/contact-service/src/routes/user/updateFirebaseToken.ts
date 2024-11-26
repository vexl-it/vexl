import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {UpdateFirebaseTokenEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {UserDbService} from '../../db/UserDbService'

export const updateFirebaseToken = Handler.make(
  UpdateFirebaseTokenEndpoint,
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
          userDb.updateFirebaseToken({
            publicKey: security['public-key'],
            hash: security.hash,
            firebaseToken: Option.fromNullable(req.body.firebaseToken),
          })
        )
        return {}
      }),
      UserNotFoundError
    )
)
