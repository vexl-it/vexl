import {HttpApiBuilder} from '@effect/platform/index'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  UnableToVerifySignatureError,
  type UpdateBadOwnerHashRequest,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {verifyUserSecurity} from '@vexl-next/server-utils/src/serverSecurity'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
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

export const updateBadOwnerHash = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'updateBadOwnerHash',
  (req) =>
    Effect.gen(function* (_) {
      if (!(yield* _(validateThatBodyInclidesValidSignatures(req.payload)))) {
        return yield* _(Effect.fail(new UnableToVerifySignatureError()))
      }

      if (req.payload.newData.hash === req.payload.oldData.hash) {
        return {updated: false}
      }

      const userDb = yield* _(UserDbService)
      const contactDb = yield* _(ContactDbService)

      const existingUserWithNewHash = yield* _(
        userDb.findUserByHash(req.payload.newData.hash)
      )

      // If user exists remove it or respond with indication that there is another account.
      if (Option.isSome(existingUserWithNewHash)) {
        if (!req.payload.removePreviousUser)
          return {updated: false, willDeleteExistingUserIfRan: true as const}

        yield* _(contactDb.deleteContactsByHashFrom(req.payload.newData.hash))
        yield* _(
          userDb.deleteUserByPublicKeyAndHash({
            hash: req.payload.newData.hash,
            publicKey: req.payload.publicKey,
          })
        )
      }

      // Update hash at user record
      yield* _(
        userDb.updateUserHash({
          oldHash: req.payload.oldData.hash,
          newHash: req.payload.newData.hash,
        })
      )

      yield* _(
        contactDb.updateContactHashFrom({
          currentHashFrom: req.payload.oldData.hash,
          newHashFrom: req.payload.newData.hash,
        })
      )

      yield* _(
        contactDb.deleteContactsByHashFromAndHashTo({
          hashFrom: req.payload.newData.hash,
          hashTo: req.payload.newData.hash,
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
          `userAction:${req.payload.newData.hash}`,
          `userAction:${req.payload.oldData.hash}`,
        ],
        500
      ),
      makeEndpointEffect
    )
)
