import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {LoggedInOnAnotherDeviceError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {ensureLoginSessionProof} from './utils/ensureLoginSessionProof'

/**
 * Deletes every phone number registered with the caller's public key, with
 * their contacts. Rows of other keys stay, even under the caller's number.
 * Only the device holding the login session of every number may do that,
 * through a number the account still holds.
 */
export const deleteAccount = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'deleteAccount',
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
          const contactDb = yield* _(ContactDbService)

          yield* _(userDb.lockAccountByPublicKey(security.publicKey))
          const accountRows = yield* _(
            userDb.findAccountSessionsByPublicKey(security.publicKey)
          )
          if (
            !Array.some(accountRows, (row) => row.hash === security.serverHash)
          )
            return {}

          const loggedInOnAnotherDevice = Array.some(accountRows, (row) =>
            Option.exists(
              row.loginSessionId,
              (stored) => stored !== req.payload.loginSessionId
            )
          )
          if (loggedInOnAnotherDevice)
            return yield* _(Effect.fail(new LoggedInOnAnotherDeviceError()))

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
