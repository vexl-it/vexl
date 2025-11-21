import notifee, {
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native'
import {type ChatId} from '@vexl-next/domain/src/general/messaging'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import {getDefaultStore} from 'jotai'
import {getCurrentLocale, translationAtom} from '../localization/I18nProvider'
import {getChannelForTradeReminders} from './notificationChannels'
import {TRADE_REMINDER_TIME_BEFORE_MEETING} from './tradeReminderConstants'

dayjs.extend(localizedFormat)

export async function scheduleTradeReminderNotification({
  chatId,
  meetingTime,
  userName,
}: {
  chatId: ChatId
  meetingTime: UnixMilliseconds
  userName: string
}): Promise<{notificationId: string; scheduledFor: UnixMilliseconds} | null> {
  const notificationTime = (meetingTime -
    TRADE_REMINDER_TIME_BEFORE_MEETING) as UnixMilliseconds

  if (notificationTime <= Date.now()) return null

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: notificationTime,
  }

  const {t} = getDefaultStore().get(translationAtom)
  const locale = getCurrentLocale()
  const formattedTime = dayjs(meetingTime).locale(locale).format('LLLL')

  const notificationId = await notifee.createTriggerNotification(
    {
      id: `${chatId}-trade-reminder`,
      title: t('notifications.TRADE_REMINDER.title', {userName}),
      body: t('notifications.TRADE_REMINDER.body', {
        userName,
        time: formattedTime,
      }),
      android: {
        channelId: await getChannelForTradeReminders(),
        smallIcon: 'notification_icon',
        pressAction: {id: 'default'},
      },
    },
    trigger
  )

  return {notificationId, scheduledFor: notificationTime}
}

export async function cancelTradeReminderNotification(
  notificationId: string
): Promise<void> {
  await notifee.cancelNotification(notificationId)
}
