import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ConnectionLevel,
  type IntendedConnectionLevel,
} from '@vexl-next/domain/src/general/offers'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {effectToTaskEither} from '../../effect-helpers/TaskEitherConverter'
import {type ExtractRightFromEffect} from '../../utils/ExtractLeft'

function fetchFriendsPublicKeys({
  lvl,
  api,
}: {
  lvl: ConnectionLevel
  api: ContactApi
}): TE.TaskEither<
  ExtractRightFromEffect<ReturnType<ContactApi['fetchMyContacts']>>,
  PublicKeyPemBase64[]
> {
  return pipe(
    effectToTaskEither(
      api.fetchMyContacts({
        query: {
          level: lvl,
          page: 0,
          limit: 1000000,
        },
      })
    ),
    TE.map((res) => res.items.map((one) => one.publicKey))
  )
}

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: PublicKeyPemBase64[]
  secondDegreeConnections: PublicKeyPemBase64[]
  commonFriends: FetchCommonConnectionsResponse
}

export type ApiErrorFetchingContactsForOffer = ExtractRightFromEffect<
  ReturnType<ContactApi['fetchMyContacts' | 'fetchCommonConnections']>
>

export default function fetchContactsForOffer({
  contactApi,
  intendedConnectionLevel,
}: {
  contactApi: ContactApi
  intendedConnectionLevel: IntendedConnectionLevel
}): TE.TaskEither<ApiErrorFetchingContactsForOffer, ConnectionsInfoForOffer> {
  return pipe(
    TE.Do,
    TE.bindW('firstDegreeConnections', () =>
      fetchFriendsPublicKeys({lvl: 'FIRST', api: contactApi})
    ),
    TE.bindW('secondDegreeConnections', () =>
      intendedConnectionLevel === 'FIRST'
        ? TE.right([])
        : fetchFriendsPublicKeys({lvl: 'SECOND', api: contactApi})
    ),
    TE.bindW(
      'commonFriends',
      ({firstDegreeConnections, secondDegreeConnections}) =>
        effectToTaskEither(
          contactApi.fetchCommonConnections({
            body: {
              publicKeys: Array.from(
                new Set<PublicKeyPemBase64>([
                  ...firstDegreeConnections,
                  ...secondDegreeConnections,
                ])
              ),
            },
          })
        )
    )
  )
}
