import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatUserIdentity} from '@vexl-next/domain/src/general/messaging'
import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {type ConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/src/Pagination.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, Option} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom, type Atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import deduplicate from '../../../utils/deduplicate'
import {
  areNotificationsEnabledE,
  getNotificationTokenE,
} from '../../../utils/notifications'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError, {reportErrorE} from '../../../utils/reportError'
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
  (
    get,
    set,
    notificationTrackingId?: NotificationTrackingId
  ): Effect.Effect<boolean> => {
    return Effect.gen(function* (_) {
      const api = get(apiAtom)

      console.log('🦋 Refreshing connections state')
      const updateStarted = unixMillisecondsNow()

      const firstLevel = yield* _(fetchContacts('FIRST', api.contact))
      const secondLevel = yield* _(fetchContacts('SECOND', api.contact))

      // report difference
      const connectionState = get(connectionStateAtom)

      if (
        !!connectionState.lastUpdate &&
        !!(yield* _(getNotificationTokenE()))
      ) {
        const newFirstLevelConnections = Array.difference(firstLevel)(
          connectionState.firstLevel
        )
        const newSecondLevelConnections = Array.difference(secondLevel)(
          connectionState.secondLevel
        )
        const newConnectionsUnique = pipe(
          newFirstLevelConnections,
          Array.appendAll(newSecondLevelConnections),
          Array.dedupe
        )

        console.log('🦋 New connections:', newConnectionsUnique.length)

        // only if notification tracking id has been passed
        if (notificationTrackingId) {
          const notificationsEnabled = yield* _(
            areNotificationsEnabledE(),
            Effect.option
          )

          yield* _(
            api.metrics
              .reportNotificationInteraction({
                count: newConnectionsUnique.length,
                notificationType: 'Network',
                ...(Option.isSome(notificationsEnabled)
                  ? {
                      notificationsEnabled:
                        notificationsEnabled.value.notifications,
                      backgroundTaskEnabled:
                        notificationsEnabled.value.backgroundTasks,
                    }
                  : {}),
                type: 'NewConnectionsReceived',
                uuid: generateUuid(),
                trackingId: notificationTrackingId,
              })
              .pipe(
                Effect.timeout(500),
                Effect.retry({times: 3}),
                Effect.tapError((e) =>
                  reportErrorE(
                    'warn',
                    new Error('Error reporting new connections'),
                    {e}
                  )
                ),
                Effect.forkDaemon
              )
          )
        }
      }

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

export const fistAndSecondLevelConnectionsReachAtom = atom((get) => {
  const connectionState = get(connectionStateAtom)

  // deduplicate to be double sure, even if we should not have duplicates here
  const firstAndSecondLevelConnections = deduplicate([
    ...connectionState.firstLevel,
    ...connectionState.secondLevel,
  ])

  return firstAndSecondLevelConnections.length
})

export const clubsConnectionsReachAtom = atom((get) => {
  return pipe(
    get(clubsWithMembersAtom),
    Array.flatMap((club) => club.members),
    Array.length
  )
})

export const reachNumberAtom = atom((get) => {
  const fistAndSecondLevelConnectionsReach = get(
    fistAndSecondLevelConnectionsReachAtom
  )
  const clubsConnectionsReach = get(clubsConnectionsReachAtom)

  return fistAndSecondLevelConnectionsReach + clubsConnectionsReach
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
