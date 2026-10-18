import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {findUserOrFail, refreshUserRecord} from './utils/refreshUserRecord'

// Unlike createUser, keeps the user row and their imported contacts.
export const restoreUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'restoreUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          const userDb = yield* _(UserDbService)
          yield* _(findUserOrFail(security))

          yield* _(
            refreshUserRecord({
              security,
              headers: req.headers,
              vexlNotificationToken: req.payload.vexlNotificationToken,
            })
          )

          if (Option.isSome(req.payload.expoToken)) {
            yield* _(
              userDb.clearExpoTokenHeldByOtherUsers({
                publicKey: security.publicKey,
                hash: security.serverHash,
                token: req.payload.expoToken.value,
              })
            )
          }
          yield* _(
            userDb.updateExpoToken({
              publicKey: security.publicKey,
              hash: security.serverHash,
              expoToken: req.payload.expoToken,
            })
          )

          yield* _(
            userDb.updateLoginSessionId({
              publicKey: security.publicKey,
              hash: security.serverHash,
              loginSessionId: req.payload.loginSessionId,
            })
          )
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
