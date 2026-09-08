import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {
  type ClubKeyNotFoundInInnerStateError,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, pipe, Record, type HashMap} from 'effect'
import {type NonEmptyArray} from 'effect/Array'
import {type OfferEncryptionProgress} from '../OfferEncryptionProgress'
import {constructAndEncryptPrivatePayloadForOwner} from '../constructPrivatePayloadForOwner'
import constructPrivatePayloads, {
  PrivatePayloadsConstructionError,
} from './constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './encryptPrivatePart'
import fetchContactsForOffer, {
  type ApiErrorFetchingContactsForOffer,
  type ConnectionsInfoForOffer,
} from './fetchContactsForOffer'

export function fetchInfoAndGeneratePrivatePayloads({
  contactApi,
  intendedConnectionLevel,
  symmetricKey,
  adminId,
  ownerCredentials,
  ownerKeyPairV2,
  intendedClubs,
  serverToClientHashesToHashedPhoneNumbersMap,
  onProgress,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
  ownerKeyPairV2: KeyPairV2
  adminId: OfferAdminId
  serverToClientHashesToHashedPhoneNumbersMap: HashMap.HashMap<
    ServerToClientHashedNumber,
    HashedPhoneNumber
  >
  intendedClubs: Record<
    ClubUuid,
    {keyPair: KeyPairV2; oldKeyPair: PrivateKeyHolder}
  >
  onProgress?: ((state: OfferEncryptionProgress) => void) | undefined
}): Effect.Effect<
  {
    ownerPrivatePayload: ServerPrivatePart
    errors: PrivatePartEncryptionError[]
    privateParts: NonEmptyArray<ServerPrivatePart>
    connections: ConnectionsInfoForOffer
  },
  | ApiErrorFetchingContactsForOffer
  | PrivatePayloadsConstructionError
  | ClubKeyNotFoundInInnerStateError
> {
  return Effect.gen(function* () {
    if (onProgress) onProgress({type: 'FETCHING_CONTACTS'})

    const connectionsInfo = yield* fetchContactsForOffer({
      serverToClientHashesToHashedPhoneNumbersMap,
      contactApi,
      intendedConnectionLevel,
      intendedClubs,
    })

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})

    const privatePayloads = yield* constructPrivatePayloads({
      connectionsInfo,
      symmetricKey,
    })

    const encryptedPrivatePayloadForOwner =
      yield* constructAndEncryptPrivatePayloadForOwner({
        ownerCredentials,
        ownerKeyPairV2,
        symmetricKey,
        adminId,
        intendedConnectionLevel,
        intendedClubs: Record.keys(connectionsInfo.clubsConnections),
      }).pipe(
        Effect.mapError(
          (e) =>
            new PrivatePayloadsConstructionError({
              cause: e,
              message: 'Error encrypting private payload for owner',
            })
        )
      )

    const encryptionResult = yield* pipe(
      privatePayloads,
      Array.map((one, i) =>
        pipe(
          Effect.Do,
          Effect.tap(() =>
            Effect.sync(() => {
              if (onProgress) {
                onProgress({
                  type: 'ENCRYPTING_PRIVATE_PAYLOADS',
                  currentlyProcessingIndex: i,
                  totalToEncrypt: privatePayloads.length,
                })
              }
            })
          ),
          Effect.flatMap(() => encryptPrivatePart(one)),
          Effect.result
        )
      ),
      Effect.all
    )

    const errors = pipe(encryptionResult, Array.getFailures)

    const encryptedPrivateParts = pipe(
      encryptionResult,
      Array.getSuccesses,
      Array.dedupeWith((one, two) => one.userPublicKey === two.userPublicKey),
      Array.filter(
        (one) => one.userPublicKey !== ownerCredentials.publicKeyPemBase64
      )
    )

    if (!Array.isArrayNonEmpty(encryptedPrivateParts)) {
      return yield* Effect.fail(
        new PrivatePayloadsConstructionError({
          message: 'No private part was encrypted',
          cause: new Error('No private part was encrypted'),
        })
      )
    }

    return {
      ownerPrivatePayload: encryptedPrivatePayloadForOwner,
      errors,
      privateParts: encryptedPrivateParts,
      connections: connectionsInfo,
    }
  })
}
