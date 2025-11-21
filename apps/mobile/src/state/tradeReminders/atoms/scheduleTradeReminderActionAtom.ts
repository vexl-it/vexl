import {type ChatId} from '@vexl-next/domain/src/general/messaging'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type WritableAtom, atom} from 'jotai'
import {
  cancelTradeReminderNotification,
  scheduleTradeReminderNotification,
} from '../../../utils/notifications/tradeReminderNotifications'
import {tradeRemindersAtom} from './tradeRemindersAtom'

export const scheduleTradeReminderActionAtom: WritableAtom<
  null,
  [
    {
      chatId: ChatId
      meetingTime: UnixMilliseconds
      userName: string
    },
  ],
  Promise<string | null>
> = atom(null, async (get, set, {chatId, meetingTime, userName}) => {
  const reminders = get(tradeRemindersAtom)
  const existingReminder = reminders.find((one) => one.chatId === chatId)

  if (existingReminder && existingReminder.meetingTime === meetingTime) {
    return existingReminder.notificationId
  }

  if (existingReminder) {
    await cancelTradeReminderNotification(existingReminder.notificationId)
  }

  const scheduled = await scheduleTradeReminderNotification({
    chatId,
    meetingTime,
    userName,
  })

  const updatedReminders = reminders.filter((one) => one.chatId !== chatId)

  if (!scheduled) {
    set(tradeRemindersAtom, updatedReminders)
    return null
  }

  set(tradeRemindersAtom, [
    ...updatedReminders,
    {
      chatId,
      notificationId: scheduled.notificationId,
      scheduledFor: scheduled.scheduledFor,
      meetingTime,
    },
  ])

  return scheduled.notificationId
})
