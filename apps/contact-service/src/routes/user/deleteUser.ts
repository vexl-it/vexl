import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

export const deleteUser = makeHttpApiHandler(
  ContactApiSpecification,
  'User',
  'deleteUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* () {
          const userDb = yield* UserDbService
          const contactDb = yield* ContactDbService

          yield* contactDb.deleteContactsByHashFrom(security.serverHash)
          yield* userDb.deleteUserByPublicKeyAndHash({
            hash: security.serverHash,
            publicKey: security.publicKey,
          })
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
