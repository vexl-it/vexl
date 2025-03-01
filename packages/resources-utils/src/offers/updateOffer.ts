import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
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
  intendedConnectionLevel,
  intendedClubs,
}: {
  offerApi: OfferApi
  adminId: OfferAdminId
  publicPayload: OfferPublicPart
  symmetricKey: SymmetricKey
  ownerKeypair: PrivateKeyHolder
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs?: ClubUuid[]
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

    const updatedOffer = yield* _(
      offerApi.updateOffer({
        body: {
          adminId,
          payloadPublic: encryptedPayload,
          offerPrivateList: [],
        },
      })
    )

    const decryptedOffer = yield* _(decryptOffer(ownerKeypair)(updatedOffer))

    yield* _(
      updateOwnerPrivatePayload({
        api: offerApi,
        ownerCredentials: ownerKeypair,
        symmetricKey,
        adminId,
        intendedConnectionLevel,
        intendedClubs,
      })
    )

    return decryptedOffer
  })
}
