import {type UserInactivityNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {translationAtom} from '../../../localization/I18nProvider'
import {notificationPreferencesAtom} from '../../../preferences'
import {displayLocalNotification} from '../../displayLocalNotification'
import {getDefaultChannel} from '../../notificationChannels'

export function handleUserInactivityNotification(
  notificationData: UserInactivityNotificationData
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const store = getDefaultStore()
    const notificationPreferences = store.get(notificationPreferencesAtom)

    if (!notificationPreferences.inactivityWarnings) {
      yield* Effect.log(
        'Received inactivity reminder notification but INACTIVITY_REMINDER notifications are disabled. Not showing notification.'
      )
      return
    }

    const {t} = store.get(translationAtom)

    yield* Effect.promise(async () => {
      await displayLocalNotification({
        channelId: await getDefaultChannel(),
        content:
          notificationData.variant === 'OFFERS_DEACTIVATED'
            ? {
                title: t(
                  'notifications.INACTIVITY_REMINDER_OFFERS_DEACTIVATED.title'
                ),
                body: t(
                  'notifications.INACTIVITY_REMINDER_OFFERS_DEACTIVATED.body'
                ),
              }
            : {
                title: t('notifications.INACTIVITY_REMINDER.title'),
                body: t('notifications.INACTIVITY_REMINDER.body'),
              },
      })
    })
  })
}
