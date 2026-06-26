import {type UserLoginOnDifferentDeviceNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {AndroidNotificationPriority} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../../../localization/I18nProvider'
import {displayLocalNotification} from '../../displayLocalNotification'
import {getDefaultChannel} from '../../notificationChannels'

export function handleUserLoginOnDifferentDeviceNotification(
  _notificationData: UserLoginOnDifferentDeviceNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const {t} = getDefaultStore().get(translationAtom)

    yield* Effect.promise(async () => {
      await displayLocalNotification({
        channelId: await getDefaultChannel(),
        content: {
          title: t('notifications.loggingOnDifferentDevice.title'),
          body: t('notifications.loggingOnDifferentDevice.body'),
          priority: AndroidNotificationPriority.HIGH,
        },
      })
    })
  })
}
