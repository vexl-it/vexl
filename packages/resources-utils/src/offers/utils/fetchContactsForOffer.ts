import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, pipe, Record} from 'effect'

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: PublicKeyPemBase64[]
  secondDegreeConnections: PublicKeyPemBase64[]
  commonFriends: FetchCommonConnectionsResponse
  clubsConnections: Record<ClubUuid, readonly PublicKeyPemBase64[]>
}

export type ApiErrorFetchingContactsForOffer = Effect.Effect.Error<
  ReturnType<ContactApi['fetchMyContacts' | 'fetchCommonConnections']>
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
      contactApi.fetchMyContacts({
        query: {
          level: 'FIRST',
          page: 0,
          limit: 1000000,
        },
      }),
      Effect.map(({items}) => items),
      Effect.map(Array.map((connection) => connection.publicKey))
    )

    const secondDegreeConnections =
      intendedConnectionLevel === 'FIRST'
        ? []
        : yield* _(
            contactApi.fetchMyContacts({
              query: {
                level: 'SECOND',
                page: 0,
                limit: 1000000,
              },
            }),
            Effect.map(({items}) => items),
            Effect.map(Array.map((connection) => connection.publicKey))
          )

    const commonFriends = yield* _(
      contactApi.fetchCommonConnections({
        body: {
          publicKeys: Array.fromIterable(
            new Set<PublicKeyPemBase64>([
              ...firstDegreeConnections,
              ...secondDegreeConnections,
            ])
          ),
        },
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
