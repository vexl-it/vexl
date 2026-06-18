import type {VexlProductNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {addNotificationToCenterActionAtom} from '../../components/NotificationsScreen/state'
import {displayLocalNotification} from './displayLocalNotification'
import {getDefaultChannel} from './notificationChannels'

const handledVexlProductNotificationUuidsAtom = atom<readonly string[]>([])

export const getVexlProductNotificationId = (uuid: string): string =>
  `vexl-product-notification-${uuid}`

export const processVexlProductNotificationActionAtom = atom(
  null,
  (get, set, data: VexlProductNotificationData) =>
    Effect.gen(function* (_) {
      const uuid = data.uuid

      if (Array.contains(get(handledVexlProductNotificationUuidsAtom), uuid)) {
        yield* _(
          Effect.log(
            `Skipping already handled Vexl product notification ${uuid}`
          )
        )
        return
      }

      set(handledVexlProductNotificationUuidsAtom, Array.prepend(uuid))

      yield* _(
        Effect.promise(async () => {
          await displayLocalNotification({
            id: getVexlProductNotificationId(uuid),
            channelId: await getDefaultChannel(),
            content: {
              title: data.title,
              body: data.description,
              data: data.toData(),
            },
          })
        })
      )

      set(addNotificationToCenterActionAtom, {
        _tag: 'VexlProductNotificationData',
        productNotification: {
          uuid: data.uuid,
          title: data.title,
          description: data.description,
          issuePushNotification: data.issuePushNotification,
          date: data.date,
          actionLink: data.actionLink,
          actionText: data.actionText,
          type: data.type,
        },
      })
    })
)
