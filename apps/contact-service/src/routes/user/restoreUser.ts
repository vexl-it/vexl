import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {ensureLoginSessionProof} from './utils/ensureLoginSessionProof'
import {
  findUserOrFail,
  notifyContactsAboutReturnedUser,
  refreshUserRecord,
} from './utils/refreshUserRecord'

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
          yield* _(
            ensureLoginSessionProof({
              publicKey: security.publicKey,
              loginSessionId: req.payload.loginSessionId,
              loginSessionProof: req.payload.loginSessionProof,
            })
          )
          const userDb = yield* _(UserDbService)
          const existingUser = yield* _(findUserOrFail(security))

          const refreshedUser = yield* _(
            refreshUserRecord({
              security,
              headers: req.headers,
              vexlNotificationToken: req.payload.vexlNotificationToken,
              existingUser,
            })
          )

          yield* _(
            userDb.updateLoginSessionId({
              publicKey: security.publicKey,
              hash: security.serverHash,
              loginSessionId: req.payload.loginSessionId,
            })
          )
          return refreshedUser
        }).pipe(
          withDbTransaction,
          withUserActionRedisLock(security.hash),
          Effect.tap(notifyContactsAboutReturnedUser),
          Effect.as({})
        )
      ),
      makeEndpointEffect
    )
)
