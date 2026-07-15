import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  type UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Duration} from 'effect/index'
import {
  cancelScheduledNotificationAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
} from 'expo-notifications'
import {getDefaultStore} from 'jotai'
import {Platform} from 'react-native'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {translationAtom} from '../localization/I18nProvider'
import {formatDateTime} from '../localization/formatting'
import {formattingLocaleAtom} from '../localization/formattingLocaleAtom'
import {getChannelForTradeReminders} from './notificationChannels'
import {TradeReminderNotificationData} from './tradeReminderNotificationData'

export const TRADE_REMINDER_TIME_BEFORE_MEETING = Duration.decode(
  '40 minutes'
).pipe(Duration.toMillis)

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

  const store = getDefaultStore()
  const {t} = store.get(translationAtom)
  const locale = store.get(formattingLocaleAtom)
  const otherSideData = getOtherSideData(chat)
  const userName = otherSideData.userName

  // Format the meeting time using the user's locale
  const formattedTime = formatDateTime(meetingTime, locale)

  console.log('[TradeReminder] Scheduling notification', {
    chatId: chat.id,
    userName,
    meetingTime,
    notificationTime,
    formattedTime,
  })

  // Ensure the trade reminder channel exists on Android before scheduling.
  const channelId = await getChannelForTradeReminders()

  const notificationId = await scheduleNotificationAsync({
    content: {
      title: t('notifications.TRADE_REMINDER.title', {userName}),
      body: t('notifications.TRADE_REMINDER.body', {time: formattedTime}),
      data: new TradeReminderNotificationData({
        inbox: chat.inbox.privateKey.publicKeyPemBase64,
        sender: chat.otherSide.publicKey,
      }).encoded,
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: notificationTime,
      ...(Platform.OS === 'android' ? {channelId} : {}),
    },
  })

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
  await cancelScheduledNotificationAsync(notificationId)
  console.log('[TradeReminder] Notification cancelled successfully', {
    notificationId,
  })
}
