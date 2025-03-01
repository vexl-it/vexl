import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect} from 'effect'

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: PublicKeyPemBase64[]
  secondDegreeConnections: PublicKeyPemBase64[]
  commonFriends: FetchCommonConnectionsResponse
}

export type ApiErrorFetchingContactsForOffer = Effect.Effect.Error<
  ReturnType<ContactApi['fetchMyContacts' | 'fetchCommonConnections']>
>

export default function fetchContactsForOffer({
  contactApi,
  intendedConnectionLevel,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
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

    return {
      firstDegreeConnections,
      secondDegreeConnections,
      commonFriends,
    } satisfies ConnectionsInfoForOffer
  })
}
