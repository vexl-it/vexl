import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/src/Pagination.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type Effect} from 'effect'
import {sequenceS} from 'fp-ts/Apply'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import deduplicate from '../../../utils/deduplicate'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {ConnectionsState} from '../domain'

const connectionStateAtom = atomWithParsedMmkvStorage(
  'connectionsState',
  {
    lastUpdate: UnixMilliseconds.parse(0),
    firstLevel: [],
    secondLevel: [],
    commonFriends: {commonContacts: []},
  },
  ConnectionsState
)

export default connectionStateAtom

function fetchContacts(
  level: ConnectionLevel,
  api: ContactApi
): TE.TaskEither<
  Effect.Effect.Error<ReturnType<ContactApi['fetchMyContacts']>>,
  PublicKeyPemBase64[]
> {
  return pipe(
    effectToTaskEither(
      api.fetchMyContacts({
        query: {
          level,
          page: 0,
          limit: MAX_PAGE_SIZE,
        },
      })
    ),
    TE.map((one) => one.items.map((oneItem) => oneItem.publicKey))
  )
}

export const syncConnectionsActionAtom = atom(
  null,
  (get, set): T.Task<boolean> => {
    const api = get(apiAtom)

    console.log('🦋 Refreshing connections state')
    const updateStarted = unixMillisecondsNow()

    return pipe(
      sequenceS(TE.ApplySeq)({
        firstLevel: fetchContacts('FIRST', api.contact),
        secondLevel: fetchContacts('SECOND', api.contact),
      }),
      TE.bindW('commonFriends', ({firstLevel, secondLevel}) =>
        effectToTaskEither(
          api.contact.fetchCommonConnections({
            body: {
              publicKeys: deduplicate([...firstLevel, ...secondLevel]),
            },
          })
        )
      ),
      TE.bindW('lastUpdate', () => TE.right(updateStarted)),
      TE.match(
        (e) => {
          void showDebugNotificationIfEnabled({
            title: 'Error while syncing connections',
            body: e._tag,
          })
          if (e._tag === 'NetworkError') {
            // TODO let user know somehow
            return false
          }
          reportError(
            'warn',
            new Error('Unable to refresh connections state'),
            {e}
          )
          return false
        },
        (data) => {
          void showDebugNotificationIfEnabled({
            title: 'Connections synced',
            body: `Finished syncing connections in ${unixMillisecondsNow() - updateStarted} ms`,
          })
          set(connectionStateAtom, data)
          return true
        }
      )
    )
  }
)

export const reachNumberAtom = selectAtom(
  connectionStateAtom,
  (connectionState) => {
    return deduplicate([
      ...connectionState.firstLevel,
      ...connectionState.secondLevel,
    ]).length
  }
)

export function createFriendLevelInfoAtom(
  publicKey: PublicKeyPemBase64
): Atom<Array<'FIRST_DEGREE' | 'SECOND_DEGREE'>> {
  return atom((get) => {
    const isFirst = get(connectionStateAtom).firstLevel.includes(publicKey)
    const isSecond = get(connectionStateAtom).secondLevel.includes(publicKey)

    const toReturn: Array<'FIRST_DEGREE' | 'SECOND_DEGREE'> = []
    if (isFirst) toReturn.push('FIRST_DEGREE' as const)
    if (isSecond) toReturn.push('SECOND_DEGREE' as const)

    return toReturn
  })
}
