import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, pipe} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const updateNotificationToken = makeHttpApiHandler(
  ContactApiSpecification,
  'User',
  'updateNotificationToken',
  (req) =>
    Effect.gen(function* () {
      const security = yield* pipe(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const userDb = yield* UserDbService
      yield* pipe(
        userDb.findUserByPublicKeyAndHash({
          hash: security.serverHash,
          publicKey: security.publicKey,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () =>
          Effect.fail(new UserNotFoundError())
        )
      )

      const expoToken = Option.fromNullishOr(req.payload.expoToken)
      if (Option.isSome(expoToken)) {
        yield* userDb.clearExpoTokenHeldByOtherUsers({
          publicKey: security.publicKey,
          hash: security.serverHash,
          token: expoToken.value,
        })
      }

      yield* userDb.updateExpoToken({
        publicKey: security.publicKey,
        hash: security.serverHash,
        expoToken,
      })
      return {}
    }).pipe(withDbTransaction, makeEndpointEffect)
)
