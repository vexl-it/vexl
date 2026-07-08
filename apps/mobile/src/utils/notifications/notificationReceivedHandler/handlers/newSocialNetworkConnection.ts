import {type NewSocialNetworkConnectionNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {apiAtom} from '../../../../api'
import {syncConnectionsActionAtom} from '../../../../state/connections/atom/connectionStateAtom'
import {updateAndReencryptAllNotesConnectionsActionAtom} from '../../../../state/connections/atom/noteToConnectionsAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../../../state/connections/atom/offerToConnectionsAtom'
import {reportNewConnectionNotificationForked} from '../../../../state/notifications/reportNewConnectionNotification'

export function handleNewSocialNetworkConnectionNotification(
  notificationData: NewSocialNetworkConnectionNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const store = getDefaultStore()

    yield* Effect.log(
      'Received notification about new user. Checking and updating offers accordingly.'
    )
    yield* reportNewConnectionNotificationForked(
      store.get(apiAtom).metrics,
      notificationData.trackingId
    )
    yield* store.set(syncConnectionsActionAtom)
    yield* store.set(updateAndReencryptAllOffersConnectionsActionAtom, {
      isInBackground: true,
    })
    yield* store.set(updateAndReencryptAllNotesConnectionsActionAtom, {
      isInBackground: true,
    })
  })
}
