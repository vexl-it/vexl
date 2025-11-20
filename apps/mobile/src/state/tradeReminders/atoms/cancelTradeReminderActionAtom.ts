import {atom} from 'jotai'
import {cancelTradeReminder} from '../../../utils/notifications/tradeReminderNotifications'
import reportError from '../../../utils/reportError'
import tradeRemindersAtom from './tradeRemindersAtom'

export const cancelTradeReminderActionAtom = atom(
  null,
  async (get, set, chatId: string) => {
    try {
      console.log('[TradeReminder] Cancel action triggered', {chatId})

      const state = get(tradeRemindersAtom)
      const reminder = state.reminders.find((r) => r.chatId === chatId)

      if (!reminder) {
        console.log('[TradeReminder] No reminder found to cancel', {chatId})
        return
      }

      console.log('[TradeReminder] Found reminder to cancel', {
        chatId,
        notificationId: reminder.notificationId,
      })

      // Cancel the notification
      await cancelTradeReminder(reminder.notificationId)

      // Remove from storage
      set(tradeRemindersAtom, {
        reminders: state.reminders.filter((r) => r.chatId !== chatId),
      })

      console.log('[TradeReminder] Reminder removed from storage', {chatId})
    } catch (error) {
      reportError('warn', new Error('Failed to cancel trade reminder'), {error})
    }
  }
)
