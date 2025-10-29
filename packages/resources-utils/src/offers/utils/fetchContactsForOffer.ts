import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type CommonConnectionsForUser} from '@vexl-next/domain/src/general/contacts'
import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, pipe, Record} from 'effect'

export const FETCH_CONNECTIONS_PAGE_SIZE = 500

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: PublicKeyPemBase64[]
  secondDegreeConnections: PublicKeyPemBase64[]
  commonFriends: readonly CommonConnectionsForUser[]
  clubsConnections: Record<ClubUuid, readonly PublicKeyPemBase64[]>
}

export type ApiErrorFetchingContactsForOffer = Effect.Effect.Error<
  ReturnType<ContactApi['fetchMyContacts' | 'fetchCommonConnectionsPaginated']>
>

export default function fetchContactsForOffer({
  contactApi,
  intendedConnectionLevel,
  intendedClubs,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
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
      })
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
            })
          )

    const commonFriends = yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          contactApi.fetchCommonConnectionsPaginated({
            publicKeys: Array.fromIterable(
              new Set<PublicKeyPemBase64>([
                ...firstDegreeConnections,
                ...secondDegreeConnections,
              ])
            ),
            nextPageToken,
            limit: FETCH_CONNECTIONS_PAGE_SIZE,
          }),
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
              keyPair,
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
      clubsConnections,
    } satisfies ConnectionsInfoForOffer
  })
}
