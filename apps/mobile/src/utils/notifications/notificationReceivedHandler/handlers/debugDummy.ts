import {type DebugDummyNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {displayLocalNotification} from '../../displayLocalNotification'

export function handleDebugDummyNotification(
  notificationData: DebugDummyNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    yield* Effect.log('Received debug dummy notification')

    if (!notificationData.acknowleadgeOnReceive) return

    yield* Effect.promise(() =>
      displayLocalNotification({
        content: {
          title: 'Dummy',
          body: 'Dummy notification was received',
        },
      })
    )
  })
}
