import notifee, {
  AndroidImportance,
  type TimestampTrigger,
  TriggerType,
} from '@notifee/react-native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  type UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import {Duration} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {getCurrentLocale, translationAtom} from '../localization/I18nProvider'
import {getChannelForTradeReminders} from './notificationChannels'
import {TradeReminderNotificationData} from './tradeReminderNotificationData'

export const TRADE_REMINDER_TIME_BEFORE_MEETING = Duration.decode(
  '40 minutes'
).pipe(Duration.toMillis)

dayjs.extend(localizedFormat)

export async function scheduleTradeReminder({
  chat,
  meetingTime,
}: {
  chat: Chat
  meetingTime: UnixMilliseconds
}): Promise<string | null> {
  const now = unixMillisecondsNow()
  const notificationTime = meetingTime - TRADE_REMINDER_TIME_BEFORE_MEETING

  // Skip if notification time is in the past
  if (notificationTime <= now) {
    console.log(
      '[TradeReminder] Skipping notification - meeting time is in the past or too soon',
      {
        chatId: chat.id,
        meetingTime,
        notificationTime,
        now,
      }
    )
    return null
  }

  const {t} = getDefaultStore().get(translationAtom)
  const locale = getCurrentLocale()
  const otherSideData = getOtherSideData(chat)
  const userName = otherSideData.userName

  // Format the meeting time using the user's locale
  const formattedTime = dayjs(meetingTime).locale(locale).format('LLL')

  console.log('[TradeReminder] Scheduling notification', {
    chatId: chat.id,
    userName,
    meetingTime,
    notificationTime,
    formattedTime,
  })

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: notificationTime,
  }

  const notificationId = await notifee.createTriggerNotification(
    {
      title: t('notifications.TRADE_REMINDER.title', {userName}),
      body: t('notifications.TRADE_REMINDER.body', {
        userName,
        time: formattedTime,
      }),
      data: new TradeReminderNotificationData({
        inbox: chat.inbox.privateKey.publicKeyPemBase64,
        sender: chat.otherSide.publicKey,
      }).encoded,
      android: {
        smallIcon: 'notification_icon',
        channelId: await getChannelForTradeReminders(),
        importance: AndroidImportance.DEFAULT,
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    },
    trigger
  )

  console.log('[TradeReminder] Notification scheduled successfully', {
    chatId: chat.id,
    notificationId,
  })

  return notificationId
}

export async function cancelTradeReminder(
  notificationId: string
): Promise<void> {
  console.log('[TradeReminder] Cancelling notification', {notificationId})
  await notifee.cancelNotification(notificationId)
  console.log('[TradeReminder] Notification cancelled successfully', {
    notificationId,
  })
}
