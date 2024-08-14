import {Schema} from '@effect/schema'
import {DeleteUserEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

export const deleteUser = Handler.make(DeleteUserEndpoint, (_, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const userDb = yield* _(UserDbService)
      const contactDb = yield* _(ContactDbService)

      yield* _(contactDb.deleteContactsByHashFrom(security.hash))
      yield* _(
        userDb.deleteUserByPublicKeyAndHash({
          hash: security.hash,
          publicKey: security['public-key'],
        })
      )
    }).pipe(withDbTransaction, withUserActionRedisLock(security.hash)),
    Schema.Void
  )
)
