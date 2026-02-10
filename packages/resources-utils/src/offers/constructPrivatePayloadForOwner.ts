import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
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
  ownerKeyPairV2,
  symmetricKey,
  adminId,
  intendedConnectionLevel,
  intendedClubs,
}: {
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: readonly ClubUuid[]
  ownerCredentials: PrivateKeyHolder
  ownerKeyPairV2?: KeyPairV2
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
}): OfferPrivatePayloadToEncrypt {
  return {
    // Use V2 public key if available, otherwise fall back to V1
    toPublicKey:
      ownerKeyPairV2?.publicKey ?? ownerCredentials.publicKeyPemBase64,
    payloadPrivate: {
      commonFriends: [],
      clubIds: [],
      friendLevel: [],
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
  ownerKeyPairV2,
  symmetricKey,
  adminId,
}: {
  intendedConnectionLevel: IntendedConnectionLevel
  intendedClubs: readonly ClubUuid[]
  ownerCredentials: PrivateKeyHolder
  ownerKeyPairV2?: KeyPairV2
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
}): Effect.Effect<ServerPrivatePart, PrivatePartEncryptionError> {
  return encryptPrivatePart(
    constructPrivatePayloadForOwner({
      ownerCredentials,
      ownerKeyPairV2,
      symmetricKey,
      adminId,
      intendedConnectionLevel,
      intendedClubs,
    })
  )
}
