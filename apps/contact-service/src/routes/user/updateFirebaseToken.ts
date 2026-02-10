import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const updateFirebaseToken = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateFirebaseToken',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const userDb = yield* _(UserDbService)
      yield* _(
        userDb.findUserByPublicKeyAndHash({
          hash: security.serverHash,
          publicKey: security.publicKey,
        }),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () =>
          Effect.fail(new UserNotFoundError())
        )
      )

      yield* _(
        userDb.updateFirebaseToken({
          publicKey: security.publicKey,
          hash: security.serverHash,
          firebaseToken: Option.fromNullable(req.payload.firebaseToken),
        })
      )
      return {}
    }).pipe(makeEndpointEffect)
)
