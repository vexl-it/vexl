import {
  type ConnectionLevel,
  type FetchCommonConnectionsResponse,
} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import * as TE from 'fp-ts/TaskEither'
import {
  type BadStatusCodeError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from '@vexl-next/rest-api/dist/Errors'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'

function fetchFriendsPublicKeys({
  lvl,
  api,
}: {
  lvl: ConnectionLevel
  api: ContactPrivateApi
}): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError,
  PublicKeyPemBase64[]
> {
  return pipe(
    api.fetchMyContacts({
      level: lvl,
      page: 0,
      limit: 1000000,
    }),
    TE.map((res) => res.items.map((one) => one.publicKey))
  )
}

export interface ConnectionsInfoForOffer {
  firstDegreeConnections: PublicKeyPemBase64[]
  secondDegreeConnections: PublicKeyPemBase64[]
  commonFriends: FetchCommonConnectionsResponse
}

export type ApiErrorFetchingContactsForOffer =
  BasicError<'ApiErrorFetchingContactsForOffer'>

export default function fetchContactsForOffer({
  contactApi,
  connectionLevel,
}: {
  contactApi: ContactPrivateApi
  connectionLevel: ConnectionLevel
}): TE.TaskEither<ApiErrorFetchingContactsForOffer, ConnectionsInfoForOffer> {
  return pipe(
    TE.Do,
    TE.bindW('firstDegreeConnections', () =>
      fetchFriendsPublicKeys({lvl: connectionLevel, api: contactApi})
    ),
    TE.bindW('secondDegreeConnections', () =>
      connectionLevel === 'FIRST'
        ? TE.right([])
        : fetchFriendsPublicKeys({lvl: 'SECOND', api: contactApi})
    ),
    TE.bindW(
      'commonFriends',
      ({firstDegreeConnections, secondDegreeConnections}) =>
        contactApi.fetchCommonConnections({
          publicKeys: Array.from(
            new Set<PublicKeyPemBase64>([
              ...firstDegreeConnections,
              ...secondDegreeConnections,
            ])
          ),
        })
    ),
    TE.mapLeft(toError('ApiErrorFetchingContactsForOffer'))
  )
}
