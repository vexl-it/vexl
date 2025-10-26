import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect, pipe} from 'effect'
import {constructPrivatePayloadForOwner} from './constructPrivatePayloadForOwner'
import {type OfferPrivatePayloadToEncrypt} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'

export default function updateOwnerPrivatePayload({
  api,
  ownerCredentials,
  symmetricKey,
  adminId,
  intendedConnectionLevel,
  intendedClubs,
}: {
  api: OfferApi
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: readonly ClubUuid[]
}): Effect.Effect<
  OfferPrivatePayloadToEncrypt,
  | PrivatePartEncryptionError
  | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
> {
  const privatePayload = constructPrivatePayloadForOwner({
    ownerCredentials,
    symmetricKey,
    adminId,
    intendedConnectionLevel,
    intendedClubs,
  })

  return pipe(
    encryptPrivatePart(privatePayload),
    Effect.flatMap((payload) =>
      api.createPrivatePart({
        adminId,
        offerPrivateList: [payload],
      })
    ),
    Effect.zipRight(Effect.succeed(privatePayload))
  )
}
