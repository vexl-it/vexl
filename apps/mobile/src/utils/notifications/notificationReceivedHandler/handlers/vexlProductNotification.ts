import {type VexlProductNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {processVexlProductNotificationActionAtom} from '../../processVexlProductNotification'

export function handleVexlProductNotification(
  notificationData: VexlProductNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    yield* Effect.log(
      'Received Vexl product notification',
      notificationData.uuid
    )

    yield* Effect.asVoid(
      getDefaultStore().set(
        processVexlProductNotificationActionAtom,
        notificationData
      )
    )
  })
}
