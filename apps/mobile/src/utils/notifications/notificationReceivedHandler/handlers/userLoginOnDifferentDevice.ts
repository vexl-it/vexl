import {Effect} from 'effect/index'
import {AndroidNotificationPriority} from 'expo-notifications'
import {type Store} from 'jotai/vanilla/store'
import {refreshUserOnContactService} from '../../../../state/refreshUserOnContactServiceInAppBackgroundTask'
import {loadSession} from '../../../../state/session/loadSession'
import {translationAtom} from '../../../localization/I18nProvider'
import {displayLocalNotification} from '../../displayLocalNotification'
import {getDefaultChannel} from '../../notificationChannels'

/**
 * With `accountMoved`, the account may have been restored on another device.
 * The notice is never trusted - only the server decides whether this device
 * gets cleared, and a cleared device shows its own notice.
 */
export function handleUserLoginOnDifferentDeviceNotice(
  store: Store,
  {accountMoved}: {readonly accountMoved: boolean}
): Effect.Effect<void> {
  return Effect.gen(function* () {
    if (accountMoved) {
      const {sessionLoaded} = yield* loadSession().pipe(
        Effect.orElseSucceed(() => ({sessionLoaded: false}))
      )
      if (sessionLoaded)
        yield* Effect.ignore(refreshUserOnContactService(store))
      return
    }

    const {t} = store.get(translationAtom)
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
