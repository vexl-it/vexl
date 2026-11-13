import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type KeyPairV2,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type FetchCommonConnectionsPaginatedResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, HashMap, pipe, Record} from 'effect'

export const FETCH_CONNECTIONS_PAGE_SIZE = 500

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
  secondDegreeConnections: Array<PublicKeyPemBase64 | PublicKeyV2>
  commonFriends: CommonConnectionsForUsers
  verifiedFriends: CommonConnectionsForUsers
  clubsConnections: Record<
    ClubUuid,
    ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  >
}

export type ApiErrorFetchingContactsForOffer = Effect.Effect.Error<
  ReturnType<
    ContactApi['fetchMyContactsPaginated' | 'fetchCommonConnectionsPaginated']
  >
>

type CommonConnectionsForUserFromApi =
  FetchCommonConnectionsPaginatedResponse['items'][number]

/**
 * Merges common connections fetched under each phone number of the account:
 * one entry per public key with the union of its hashes and verified hashes.
 */
export function mergeCommonConnections(
  connectionsPerPhoneNumber: ReadonlyArray<
    readonly CommonConnectionsForUserFromApi[]
  >
): CommonConnectionsForUserFromApi[] {
  return pipe(
    connectionsPerPhoneNumber,
    Array.flatten,
    Array.groupBy((one) => one.publicKey),
    Record.values,
    Array.map((sameKey) => ({
      publicKey: Array.headNonEmpty(sameKey).publicKey,
      common: {
        hashes: pipe(
          sameKey,
          Array.flatMap((one) => one.common.hashes),
          Array.dedupe
        ),
        verifiedHashes: pipe(
          sameKey,
          Array.flatMap((one) => one.common.verifiedHashes),
          Array.dedupe
        ),
      },
    }))
  )
}

/**
 * @param contactApis one per phone number of the account
 */
export function fetchCommonConnections({
  contactApis,
  publicKeys,
  serverToClientHashesToHashedPhoneNumbersMap,
}: {
  contactApis: readonly ContactApi[]
  publicKeys: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
  serverToClientHashesToHashedPhoneNumbersMap: HashMap.HashMap<
    ServerToClientHashedNumber,
    HashedPhoneNumber
  >
}): Effect.Effect<
  {
    commonFriends: CommonConnectionsForUsers
    verifiedFriends: CommonConnectionsForUsers
  },
  Effect.Effect.Error<ReturnType<ContactApi['fetchCommonConnectionsPaginated']>>
> {
  const toConnectionsForUsers = (
    connections: readonly CommonConnectionsForUserFromApi[],
    hashesOf: (
      one: CommonConnectionsForUserFromApi
    ) => readonly ServerToClientHashedNumber[]
  ): CommonConnectionsForUsers =>
    pipe(
      connections,
      Array.map(
        (one): [PublicKeyPemBase64 | PublicKeyV2, HashedPhoneNumber[]] => [
          one.publicKey,
          Array.filterMap(hashesOf(one), (hash) =>
            HashMap.get(serverToClientHashesToHashedPhoneNumbersMap, hash)
          ),
        ]
      ),
      HashMap.fromIterable
    )

  return pipe(
    contactApis,
    Effect.forEach(
      (contactApi) =>
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            contactApi.fetchCommonConnectionsPaginated({
              publicKeys,
              limit: FETCH_CONNECTIONS_PAGE_SIZE,
              nextPageToken,
            }),
        }),
      {concurrency: 'unbounded'}
    ),
    Effect.map(mergeCommonConnections),
    Effect.map((connections) => ({
      commonFriends: toConnectionsForUsers(
        connections,
        (one) => one.common.hashes
      ),
      verifiedFriends: toConnectionsForUsers(
        connections,
        (one) => one.common.verifiedHashes
      ),
    }))
  )
}

export type OwnPublicKeys = ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>

/**
 * Every phone number of the user has its own key and imports the same
 * contacts, so the other numbers come back as the user's own connections.
 *
 * @param ownPublicKeys keys of all phone numbers of the user, never connections
 */
export function fetchMyConnections({
  contactApi,
  level,
  ownPublicKeys,
}: {
  contactApi: Pick<ContactApi, 'fetchMyContactsPaginated'>
  level: 'FIRST' | 'SECOND'
  ownPublicKeys: OwnPublicKeys
}): Effect.Effect<
  Array<PublicKeyPemBase64 | PublicKeyV2>,
  Effect.Effect.Error<ReturnType<ContactApi['fetchMyContactsPaginated']>>
> {
  return fetchAllPaginatedData({
    fetchEffectToRun: (nextPageToken) =>
      contactApi.fetchMyContactsPaginated({
        level,
        limit: FETCH_CONNECTIONS_PAGE_SIZE,
        nextPageToken,
      }),
  }).pipe(
    Effect.map(Array.filter((one) => !Array.contains(ownPublicKeys, one)))
  )
}

/**
 * First and second level connections come from the main number only: every
 * number imports the same contacts. Common connections come from every number.
 *
 * @param contactApis one per phone number of the account, the main number first
 * @param ownPublicKeys keys of all phone numbers of the user, never connections
 */
export default function fetchContactsForOffer({
  contactApis,
  ownPublicKeys,
  intendedConnectionLevel,
  intendedClubs,
  serverToClientHashesToHashedPhoneNumbersMap,
}: {
  contactApis: Array.NonEmptyReadonlyArray<ContactApi>
  ownPublicKeys: OwnPublicKeys
  intendedConnectionLevel: IntendedConnectionLevel
  serverToClientHashesToHashedPhoneNumbersMap: HashMap.HashMap<
    ServerToClientHashedNumber,
    HashedPhoneNumber
  >
  intendedClubs: Record<
    ClubUuid,
    {keyPair: KeyPairV2; oldKeyPair: PrivateKeyHolder}
  >
}): Effect.Effect<ConnectionsInfoForOffer, ApiErrorFetchingContactsForOffer> {
  const contactApi = Array.headNonEmpty(contactApis)

  return Effect.gen(function* (_) {
    const firstDegreeConnections = yield* _(
      fetchMyConnections({contactApi, level: 'FIRST', ownPublicKeys})
    )

    const secondDegreeConnections =
      intendedConnectionLevel === 'FIRST'
        ? []
        : yield* _(
            fetchMyConnections({contactApi, level: 'SECOND', ownPublicKeys})
          )

    const {commonFriends, verifiedFriends} = yield* _(
      fetchCommonConnections({
        contactApis,
        publicKeys: pipe(
          [...firstDegreeConnections, ...secondDegreeConnections],
          Array.dedupe
        ),
        serverToClientHashesToHashedPhoneNumbersMap,
      })
    )

    const clubsConnections = yield* _(
      pipe(
        intendedClubs,
        Record.toEntries,
        Array.map(([clubUuid, keyPair]) =>
          contactApi
            .getClubContacts({
              clubUuid,
              keyPair: keyPair.oldKeyPair,
              keyPairV2: keyPair.keyPair,
            })
            .pipe(Effect.option)
        ),
        Effect.all,
        Effect.map(Array.getSomes),
        Effect.map(Array.map((one) => [one.clubUuid, one.items] as const)),
        Effect.map(Record.fromEntries)
      )
    )

    return {
      firstDegreeConnections,
      secondDegreeConnections,
      commonFriends,
      verifiedFriends,
      clubsConnections,
    } satisfies ConnectionsInfoForOffer
  })
}
