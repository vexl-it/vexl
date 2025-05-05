import {type KeyHolder} from '@vexl-next/cryptography'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
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
import {Array, Effect, Either, Record} from 'effect'
import {type NonEmptyArray} from 'effect/Array'
import {pipe} from 'fp-ts/function'
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
  intendedClubs,
  onProgress,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
  adminId: OfferAdminId
  intendedClubs: Record<ClubUuid, KeyHolder.PrivateKeyHolder>
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
  return Effect.gen(function* (_) {
    if (onProgress) onProgress({type: 'FETCHING_CONTACTS'})

    const connectionsInfo = yield* _(
      fetchContactsForOffer({
        contactApi,
        intendedConnectionLevel,
        intendedClubs,
      })
    )

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})

    const privatePayloads = yield* _(
      constructPrivatePayloads({
        connectionsInfo,
        symmetricKey,
      })
    )

    const encryptedPrivatePayloadForOwner = yield* _(
      constructAndEncryptPrivatePayloadForOwner({
        ownerCredentials,
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
    )

    const encryptionResult = yield* _(
      privatePayloads,
      Array.map((one, i) =>
        pipe(
          Effect.Do,
          Effect.tap(() => {
            if (onProgress) {
              onProgress({
                type: 'ENCRYPTING_PRIVATE_PAYLOADS',
                currentlyProcessingIndex: i,
                totalToEncrypt: privatePayloads.length,
              })
            }
          }),
          Effect.flatMap(() => encryptPrivatePart(one)),
          Effect.either
        )
      ),
      Effect.all
    )

    const errors = pipe(encryptionResult, Array.filterMap(Either.getLeft))

    const encryptedPrivateParts = pipe(
      encryptionResult,
      Array.filterMap(Either.getRight),
      Array.dedupeWith((one, two) => one.userPublicKey === two.userPublicKey),
      Array.filter(
        (one) => one.userPublicKey !== ownerCredentials.publicKeyPemBase64
      )
    )

    if (!Array.isNonEmptyArray(encryptedPrivateParts)) {
      return yield* _(
        Effect.fail(
          new PrivatePayloadsConstructionError({
            message: 'No private part was encrypted',
            cause: new Error('No private part was encrypted'),
          })
        )
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
