import {type ChatId} from '@vexl-next/domain/src/general/messaging'
import {type WritableAtom, atom} from 'jotai'
import {cancelTradeReminderNotification} from '../../../utils/notifications/tradeReminderNotifications'
import {tradeRemindersAtom} from './tradeRemindersAtom'

export const cancelTradeReminderActionAtom: WritableAtom<
  null,
  [ChatId],
  Promise<void>
> = atom(null, async (get, set, chatId) => {
  const reminders = get(tradeRemindersAtom)
  const reminder = reminders.find((one) => one.chatId === chatId)

  if (!reminder) return

  await cancelTradeReminderNotification(reminder.notificationId)
  set(
    tradeRemindersAtom,
    reminders.filter((one) => one.chatId !== chatId)
  )
})
