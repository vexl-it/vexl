import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, flow, HashMap, Option, pipe, Record} from 'effect'

export const FETCH_CONNECTIONS_PAGE_SIZE = 500

// Contact with optional V2 public key (for club members)
export interface ContactWithV2Key {
  publicKey: PublicKeyPemBase64 | PublicKeyV2
  publicKeyV2: Option.Option<PublicKeyV2>
}

// Helper to extract just the public key from ContactWithV2Key
export const extractPublicKey = (
  contact: ContactWithV2Key
): PublicKeyPemBase64 | PublicKeyV2 => contact.publicKey

// Helper to extract public keys from club contacts
export const extractPublicKeysFromClubContacts = (
  clubsConnections: Record<ClubUuid, readonly ContactWithV2Key[]>
): Record<ClubUuid, ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>> =>
  pipe(
    clubsConnections,
    Record.map((contacts) => Array.map(contacts, extractPublicKey))
  )

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
  secondDegreeConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
  commonFriends: CommonConnectionsForUsers
  // Club connections now include V2 keys for future use
  clubsConnections: Record<ClubUuid, readonly ContactWithV2Key[]>
}

export type ApiErrorFetchingContactsForOffer = Effect.Effect.Error<
  ReturnType<ContactApi['fetchMyContacts' | 'fetchCommonConnectionsPaginated']>
>

export default function fetchContactsForOffer({
  contactApi,
  intendedConnectionLevel,
  intendedClubs,
  serverToClientHashesToHashedPhoneNumbersMap,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
  serverToClientHashesToHashedPhoneNumbersMap: HashMap.HashMap<
    ServerToClientHashedNumber,
    HashedPhoneNumber
  >
  intendedClubs: Record<ClubUuid, PrivateKeyHolder>
}): Effect.Effect<ConnectionsInfoForOffer, ApiErrorFetchingContactsForOffer> {
  return Effect.gen(function* (_) {
    const firstDegreeConnections = yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          contactApi.fetchMyContactsPaginated({
            level: 'FIRST',
            limit: FETCH_CONNECTIONS_PAGE_SIZE,
            nextPageToken,
          }),
      }),
      Effect.map(
        Array.map((item) =>
          Option.isSome(item.publicKeyV2)
            ? item.publicKeyV2.value
            : item.publicKey
        )
      )
    )

    const secondDegreeConnections =
      intendedConnectionLevel === 'FIRST'
        ? []
        : yield* _(
            fetchAllPaginatedData({
              fetchEffectToRun: (nextPageToken) =>
                contactApi.fetchMyContactsPaginated({
                  level: 'SECOND',
                  limit: FETCH_CONNECTIONS_PAGE_SIZE,
                  nextPageToken,
                }),
            }),
            Effect.map(
              Array.map((item) =>
                Option.isSome(item.publicKeyV2)
                  ? item.publicKeyV2.value
                  : item.publicKey
              )
            )
          )

    const commonFriends = yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          contactApi.fetchCommonConnectionsPaginated({
            publicKeys: pipe(
              [...firstDegreeConnections, ...secondDegreeConnections],
              Array.dedupe,
              // Extract V1 keys only - common connections API still expects V1 keys
              Array.filterMap((key) =>
                key.startsWith('V2_PUB_')
                  ? Option.none()
                  : Option.some(key as PublicKeyPemBase64)
              )
            ),
            nextPageToken,
            limit: FETCH_CONNECTIONS_PAGE_SIZE,
          }),
      }),
      Effect.map(
        flow(
          Array.map(
            (one) =>
              [
                one.publicKey,
                Array.filterMap(one.common.hashes, (hash) =>
                  HashMap.get(serverToClientHashesToHashedPhoneNumbersMap, hash)
                ),
              ] as const
          ),
          HashMap.fromIterable
        )
      )
    )

    const clubsConnections = yield* _(
      pipe(
        intendedClubs,
        Record.toEntries,
        Array.map(([clubUuid, keyPair]) =>
          contactApi
            .getClubContacts({
              clubUuid,
              keyPair,
            })
            .pipe(Effect.option)
        ),
        Effect.all,
        Effect.map(Array.getSomes),
        Effect.map(Array.map((one) => [one.clubUuid, one.itemsV2] as const)),
        Effect.map(Record.fromEntries)
      )
    )

    return {
      firstDegreeConnections,
      secondDegreeConnections,
      commonFriends,
      clubsConnections,
    } satisfies ConnectionsInfoForOffer
  })
}
