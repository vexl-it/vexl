import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const updateNotificationToken = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateNotificationToken',
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

      const expoToken = Option.fromNullable(req.payload.expoToken)
      if (Option.isSome(expoToken)) {
        yield* _(
          userDb.clearExpoTokenHeldByOtherUsers({
            publicKey: security.publicKey,
            hash: security.serverHash,
            token: expoToken.value,
          })
        )
      }

      yield* _(
        userDb.updateExpoToken({
          publicKey: security.publicKey,
          hash: security.serverHash,
          expoToken,
        })
      )
      return {}
    }).pipe(withDbTransaction, makeEndpointEffect)
)
