import {type KeyHolder} from '@vexl-next/cryptography'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
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
import {Array, Effect, Either} from 'effect'
import {type NonEmptyArray} from 'effect/Array'
import {pipe} from 'fp-ts/function'
import {type OfferEncryptionProgress} from '../OfferEncryptionProgress'
import {constructPrivatePayloadForOwner} from '../constructPrivatePayloadForOwner'
import constructPrivatePayloads, {
  PrivatePayloadsConstructionError,
} from './constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './encryptPrivatePart'
import fetchClubsInfoForOffer, {
  type ApiErrorFetchingClubMembersForOffer,
} from './fetchClubsInfoForOffer'
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
  myStoredClubs,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
  symmetricKey: SymmetricKey
  ownerCredentials: PrivateKeyHolder
  adminId: OfferAdminId
  intendedClubs?: ClubUuid[]
  onProgress?: ((state: OfferEncryptionProgress) => void) | undefined
  myStoredClubs: Record<ClubUuid, KeyHolder.PrivateKeyHolder>
}): Effect.Effect<
  {
    errors: PrivatePartEncryptionError[]
    privateParts: NonEmptyArray<ServerPrivatePart>
    connections: ConnectionsInfoForOffer
    clubsConnections: PublicKeyPemBase64[]
  },
  | ApiErrorFetchingContactsForOffer
  | PrivatePayloadsConstructionError
  | ApiErrorFetchingClubMembersForOffer
  | ClubKeyNotFoundInInnerStateError
> {
  return Effect.gen(function* (_) {
    if (onProgress) onProgress({type: 'FETCHING_CONTACTS'})

    const connectionsInfo = yield* _(
      fetchContactsForOffer({contactApi, intendedConnectionLevel})
    )

    const clubIdWithMembers = intendedClubs
      ? yield* _(
          fetchClubsInfoForOffer({intendedClubs, contactApi, myStoredClubs})
        )
      : []

    if (onProgress) onProgress({type: 'CONSTRUCTING_PRIVATE_PAYLOADS'})

    const privatePayloads = yield* _(
      constructPrivatePayloads({
        connectionsInfo,
        symmetricKey,
        clubIdWithMembers,
      })
    )

    console.log(`Private payloads: ${JSON.stringify(privatePayloads, null, 2)}`)

    const privatePayloadsIncludingOwnerInfo = [
      constructPrivatePayloadForOwner({
        ownerCredentials,
        symmetricKey,
        adminId,
        intendedConnectionLevel,
        intendedClubs,
      }),
      ...privatePayloads,
    ]

    const encryptionResult = yield* _(
      privatePayloadsIncludingOwnerInfo,
      Array.map((one, i) =>
        pipe(
          Effect.Do,
          Effect.tap(() => {
            if (onProgress) {
              onProgress({
                type: 'ENCRYPTING_PRIVATE_PAYLOADS',
                currentlyProcessingIndex: i,
                totalToEncrypt: privatePayloadsIncludingOwnerInfo.length,
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
      Array.filterMap(Either.getRight)
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
      errors,
      privateParts: encryptedPrivateParts,
      connections: connectionsInfo,
      clubsConnections: clubIdWithMembers.flatMap((club) => club.items),
    }
  })
}
