import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  DuplicatedPublicKeyError,
  MissingOwnerPrivatePartError,
  type ServerPrivatePart,
} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, pipe} from 'effect'

export const validatePrivatePartsWhenSavingAll = ({
  privateParts,
  ownersPublicKey,
}: {
  privateParts: readonly ServerPrivatePart[]
  ownersPublicKey: PublicKeyPemBase64
}): Effect.Effect<
  void,
  MissingOwnerPrivatePartError | DuplicatedPublicKeyError
> =>
  Effect.gen(function* (_) {
    const keysArray = Array.map(
      privateParts,
      (privatePart) => privatePart.userPublicKey
    )

    const hasUserPublicKey = Array.contains(keysArray, ownersPublicKey)

    if (!hasUserPublicKey) {
      return yield* _(new MissingOwnerPrivatePartError({status: 400}))
    }

    const uniqueLength = pipe(keysArray, Array.dedupe, Array.length)
    if (uniqueLength !== keysArray.length) {
      return yield* _(new DuplicatedPublicKeyError({status: 400}))
    }

    return Effect.void
  })
