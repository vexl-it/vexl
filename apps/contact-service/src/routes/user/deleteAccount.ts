import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

/**
 * Deletes every phone number registered with the caller's public key, with
 * their contacts. Rows of other keys stay, even under the caller's number.
 */
export const deleteAccount = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'deleteAccount',
  () =>
    CurrentSecurity.pipe(
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          const userDb = yield* _(UserDbService)
          const contactDb = yield* _(ContactDbService)

          const deletedHashes = yield* _(
            userDb.deleteUsersByPublicKey(security.publicKey)
          )
          yield* _(
            Effect.forEach(deletedHashes, contactDb.deleteContactsByHashFrom, {
              discard: true,
            })
          )
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
