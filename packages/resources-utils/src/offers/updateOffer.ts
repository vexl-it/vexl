import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import updateOwnerPrivatePayload from './updateOwnerPrivatePayload'
import encryptOfferPublicPayload, {
  type PublicPartEncryptionError,
} from './utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from './utils/encryptPrivatePart'

export type ApiErrorUpdatingOffer = Effect.Effect.Error<
  ReturnType<OfferApi['updateOffer']>
>
export default function updateOffer({
  offerApi,
  adminId,
  publicPayload,
  symmetricKey,
  ownerKeypair,
  ownerKeyPairV2,
  intendedConnectionLevel,
  intendedClubs,
}: {
  offerApi: OfferApi
  adminId: OfferAdminId
  publicPayload: OfferPublicPart
  symmetricKey: SymmetricKey
  ownerKeypair: PrivateKeyHolder
  ownerKeyPairV2?: KeyPairV2
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: readonly ClubUuid[]
}): Effect.Effect<
  OfferInfo,
  | ApiErrorUpdatingOffer
  | PublicPartEncryptionError
  | PrivatePartEncryptionError
  | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
  | DecryptingOfferError
  | NonCompatibleOfferVersionError
> {
  return Effect.gen(function* (_) {
    const encryptedPayload = yield* _(
      encryptOfferPublicPayload({
        offerPublicPart: publicPayload,
        symmetricKey,
      })
    )

    yield* _(
      updateOwnerPrivatePayload({
        api: offerApi,
        ownerCredentials: ownerKeypair,
        ownerKeyPairV2,
        symmetricKey,
        adminId,
        intendedConnectionLevel,
        intendedClubs,
      })
    )

    const updatedOffer = yield* _(
      offerApi.updateOffer({
        adminId,
        payloadPublic: encryptedPayload,
        offerPrivateList: [],
      }),
      Effect.flatMap(
        decryptOffer(
          ownerKeypair,
          // Use real V2 keypair when available, otherwise placeholder for backward compat
          ownerKeyPairV2 ?? ({} as KeyPairV2)
        )
      )
    )

    return updatedOffer
  })
}
