import {type WritableAtom, atom} from 'jotai'
import {cancelTradeReminderNotification} from '../../../utils/notifications/tradeReminderNotifications'
import messagingStateAtom from '../../chat/atoms/messagingStateAtom'
import {tradeRemindersAtom} from './tradeRemindersAtom'

export const cleanupOldTradeRemindersActionAtom: WritableAtom<
  null,
  [],
  Promise<void>
> = atom(null, async (get, set) => {
  const reminders = get(tradeRemindersAtom)
  const messagingState = get(messagingStateAtom)
  const now = Date.now()

  const activeChatIds = new Set(
    messagingState.flatMap((inbox) =>
      inbox.chats.map((oneChat) => oneChat.chat.id)
    )
  )

  const remindersToKeep = reminders.filter(
    (one) => activeChatIds.has(one.chatId) && one.meetingTime > now
  )

  const remindersToRemove = reminders.filter(
    (one) => !remindersToKeep.includes(one)
  )

  await Promise.all(
    remindersToRemove.map((one) =>
      cancelTradeReminderNotification(one.notificationId)
    )
  )

  set(tradeRemindersAtom, remindersToKeep)
})
