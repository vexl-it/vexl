import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, type Effect} from 'effect'
import {type OfferPrivatePayloadToEncrypt} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'

export function constructPrivatePayloadForOwner({
  ownerCredentials,
  symmetricKey,
  adminId,
  intendedConnectionLevel,
  intendedClubs,
}: {
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: readonly ClubUuid[]
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
}): OfferPrivatePayloadToEncrypt {
  return {
    toPublicKey: ownerCredentials.publicKeyPemBase64,
    payloadPrivate: {
      commonFriends: [],
      clubIds: [],
      friendLevel: [
        intendedConnectionLevel === 'ALL' ? 'FIRST_DEGREE' : 'SECOND_DEGREE',
        ...(Array.isNonEmptyReadonlyArray(intendedClubs)
          ? ['CLUB' as const]
          : []),
      ],
      symmetricKey,
      // THIS is for owner!
      intendedConnectionLevel,
      intendedClubs,
      adminId,
    },
  }
}

export function constructAndEncryptPrivatePayloadForOwner({
  intendedConnectionLevel,
  intendedClubs,
  ownerCredentials,
  symmetricKey,
  adminId,
}: {
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: readonly ClubUuid[]
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
}): Effect.Effect<ServerPrivatePart, PrivatePartEncryptionError> {
  return encryptPrivatePart(
    constructPrivatePayloadForOwner({
      ownerCredentials,
      symmetricKey,
      adminId,
      intendedConnectionLevel,
      intendedClubs,
    })
  )
}
