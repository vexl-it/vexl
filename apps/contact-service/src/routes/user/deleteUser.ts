import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

export const deleteUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'deleteUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          const userDb = yield* _(UserDbService)
          const contactDb = yield* _(ContactDbService)
          const userKey = {
            hash: security.serverHash,
            publicKey: security.publicKey,
          }

          // The number may belong to another account by now; keep its contacts
          const user = yield* _(userDb.findUserByPublicKeyAndHash(userKey))
          if (Option.isNone(user)) return {}

          yield* _(contactDb.deleteContactsByHashFrom(security.serverHash))
          yield* _(userDb.deleteUserByPublicKeyAndHash(userKey))
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
