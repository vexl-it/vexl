import {type NewClubConnectionNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../../../../state/clubs/atom/refreshClubsActionAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../../../state/connections/atom/offerToConnectionsAtom'

export function handleNewClubConnectionNotification(
  notificationData: NewClubConnectionNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const store = getDefaultStore()

    yield* Effect.log(
      'Received notification about new user in club. Checking and updating offers accordingly.',
      notificationData.clubUuids
    )
    yield* store.set(syncAllClubsHandleStateWhenNotFoundActionAtom, {
      updateOnlyUuids: notificationData.clubUuids,
    })
    yield* store.set(updateAndReencryptAllOffersConnectionsActionAtom, {
      isInBackground: true,
    })
  })
}
