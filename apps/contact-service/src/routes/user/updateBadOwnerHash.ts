import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {verifyUserSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  UnableToVerifySignatureError,
  UpdateBadOwnerHashErrors,
  type UpdateBadOwnerHashRequest,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {UpdateBadOwnerHashEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'

const validateHashAndSignature = ({
  hash,
  signature,
  publicKey,
}: {
  hash: HashedPhoneNumber
  signature: EcdsaSignature
  publicKey: PublicKeyPemBase64
}): Effect.Effect<boolean, never, ServerCrypto> =>
  verifyUserSecurity({hash, signature, 'public-key': publicKey}).pipe(
    Effect.match({
      onFailure: () => false,
      onSuccess: () => true,
    })
  )

const validateThatBodyInclidesValidSignatures = (
  body: UpdateBadOwnerHashRequest
): Effect.Effect<boolean, never, ServerCrypto> =>
  Effect.gen(function* (_) {
    return (
      (yield* _(
        validateHashAndSignature({
          publicKey: body.publicKey,
          ...body.newData,
        })
      )) &&
      (yield* _(
        validateHashAndSignature({
          publicKey: body.publicKey,
          ...body.oldData,
        })
      ))
    )
  })

export const updateBadOwnerHash = Handler.make(
  UpdateBadOwnerHashEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        if (!(yield* _(validateThatBodyInclidesValidSignatures(req.body)))) {
          return yield* _(Effect.fail(new UnableToVerifySignatureError()))
        }

        if (req.body.newData.hash === req.body.oldData.hash) {
          return {updated: false}
        }

        const userDb = yield* _(UserDbService)
        const contactDb = yield* _(ContactDbService)

        const existingUserWithNewHash = yield* _(
          userDb.findUserByHash(req.body.newData.hash)
        )

        // If user exists remove it or respond with indication that there is another account.
        if (Option.isSome(existingUserWithNewHash)) {
          if (!req.body.removePreviousUser)
            return {updated: false, willDeleteExistingUserIfRan: true as const}

          yield* _(contactDb.deleteContactsByHashFrom(req.body.newData.hash))
          yield* _(
            userDb.deleteUserByPublicKeyAndHash({
              hash: req.body.newData.hash,
              publicKey: req.body.publicKey,
            })
          )
        }

        // Update hash at user record
        yield* _(
          userDb.updateUserHash({
            oldHash: req.body.oldData.hash,
            newHash: req.body.newData.hash,
          })
        )

        yield* _(
          contactDb.updateContactHashFrom({
            currentHashFrom: req.body.oldData.hash,
            newHashFrom: req.body.newData.hash,
          })
        )

        return {
          updated: true,
        }
      }).pipe(
        withDbTransaction,
        // Make sure to lock on both hashes to prevent dangling records
        // when there are multiple parallel requests.
        withRedisLock(
          [
            `userAction:${req.body.newData.hash}`,
            `userAction:${req.body.oldData.hash}`,
          ],
          500
        )
      ),
      UpdateBadOwnerHashErrors
    )
)
