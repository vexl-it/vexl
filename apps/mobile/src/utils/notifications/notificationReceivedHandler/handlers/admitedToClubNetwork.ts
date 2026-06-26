import {type AdmitedToClubNetworkNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {checkForClubsAdmissionActionAtom} from '../../../../state/clubs/atom/checkForClubsAdmissionActionAtom'

export function handleAdmitedToClubNetworkNotification(
  notificationData: AdmitedToClubNetworkNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    yield* Effect.log(
      'Received notification about being added to club',
      notificationData.publicKey
    )
    yield* getDefaultStore().set(checkForClubsAdmissionActionAtom)
  })
}
