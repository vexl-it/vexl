import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {type Effect} from 'effect'
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
  intendedClubs?: ClubUuid[]
  ownerCredentials: PrivateKeyHolder
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
}): OfferPrivatePayloadToEncrypt {
  return {
    toPublicKey: ownerCredentials.publicKeyPemBase64,
    payloadPrivate: {
      commonFriends: [],
      friendLevel: [
        intendedConnectionLevel === 'ALL' ? 'FIRST_DEGREE' : 'SECOND_DEGREE',
      ],
      clubIds: [],
      intendedConnectionLevel,
      intendedClubs,
      symmetricKey,
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
  intendedClubs?: ClubUuid[]
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
