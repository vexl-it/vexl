import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatUserIdentity} from '@vexl-next/domain/src/general/messaging'
import {type ConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/src/Pagination.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type Array, Effect} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom, type Atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import deduplicate from '../../../utils/deduplicate'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {clubsWithMembersAtom} from '../../clubs/atom/clubsWithMembersAtom'
import {ConnectionsState} from '../domain'

const connectionStateAtom = atomWithParsedMmkvStorageE(
  'connectionsState',
  {
    lastUpdate: UnixMilliseconds0,
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
): Effect.Effect<
  PublicKeyPemBase64[],
  Effect.Effect.Error<ReturnType<ContactApi['fetchMyContacts']>>
> {
  return pipe(
    api.fetchMyContacts({
      query: {
        level,
        page: 0,
        limit: MAX_PAGE_SIZE,
      },
    }),
    Effect.map((one) => one.items.map((oneItem) => oneItem.publicKey))
  )
}

export const syncConnectionsActionAtom = atom(
  null,
  (get, set): Effect.Effect<boolean> => {
    return Effect.gen(function* (_) {
      const api = get(apiAtom)

      console.log('🦋 Refreshing connections state')
      const updateStarted = unixMillisecondsNow()

      const firstLevel = yield* _(fetchContacts('FIRST', api.contact))
      const secondLevel = yield* _(fetchContacts('SECOND', api.contact))

      const commonFriends = yield* _(
        api.contact.fetchCommonConnections({
          body: {
            publicKeys: deduplicate([...firstLevel, ...secondLevel]),
          },
        })
      )
      const lastUpdate = updateStarted

      void showDebugNotificationIfEnabled({
        title: 'Connections synced',
        subtitle: 'syncConnectionsActionAtom',
        body: `Finished syncing connections in ${unixMillisecondsNow() - updateStarted} ms`,
      })

      set(connectionStateAtom, {
        firstLevel,
        secondLevel,
        commonFriends,
        lastUpdate,
      })
    }).pipe(
      Effect.tapError((e) =>
        Effect.sync(() => {
          void showDebugNotificationIfEnabled({
            title: 'Error while syncing connections',
            subtitle: 'syncConnectionsActionAtom',
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
        })
      ),
      Effect.mapBoth({
        onFailure: () => false,
        onSuccess: () => true,
      }),
      Effect.merge
    )
  }
)

export const reachNumberAtom = atom((get) => {
  const clubsWithMembers = get(clubsWithMembersAtom)
  const connectionState = get(connectionStateAtom)

  const firstAndSecondLevelConnections = deduplicate([
    ...connectionState.firstLevel,
    ...connectionState.secondLevel,
  ])

  const clubsConnections = clubsWithMembers

  // deduplicate to be double sure, even if we should not have duplicates here
  return deduplicate([...firstAndSecondLevelConnections, ...clubsConnections])
    .length
})

export function createFriendLevelInfoAtom(
  otherSide: ChatUserIdentity
): Atom<Array<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'>> {
  return atom((get) => {
    const isFirst = get(connectionStateAtom).firstLevel.includes(
      otherSide.publicKey
    )
    const isSecond = get(connectionStateAtom).secondLevel.includes(
      otherSide.publicKey
    )

    const toReturn: Array<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'> = []
    if (isFirst) toReturn.push('FIRST_DEGREE' as const)
    if (isSecond) toReturn.push('SECOND_DEGREE' as const)
    if (otherSide.clubsIds && otherSide.clubsIds.length > 0)
      toReturn.push('CLUB' as const)

    return toReturn
  })
}
