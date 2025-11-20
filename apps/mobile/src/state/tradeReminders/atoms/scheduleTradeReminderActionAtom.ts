import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {atom} from 'jotai'
import {
  cancelTradeReminder,
  scheduleTradeReminder,
} from '../../../utils/notifications/tradeReminderNotifications'
import reportError from '../../../utils/reportError'
import {type TradeReminder} from '../domain'
import tradeRemindersAtom from './tradeRemindersAtom'

export const scheduleTradeReminderActionAtom = atom(
  null,
  async (
    get,
    set,
    {chat, meetingTime}: {chat: Chat; meetingTime: UnixMilliseconds}
  ) => {
    try {
      console.log('[TradeReminder] Action triggered', {
        chatId: chat.id,
        meetingTime,
      })

      const state = get(tradeRemindersAtom)
      const existingReminder = state.reminders.find((r) => r.chatId === chat.id)

      // Cancel existing reminder if there is one
      if (existingReminder) {
        console.log('[TradeReminder] Found existing reminder, cancelling', {
          chatId: chat.id,
          existingNotificationId: existingReminder.notificationId,
        })
        await cancelTradeReminder(existingReminder.notificationId)
      }

      // Schedule new reminder
      const notificationId = await scheduleTradeReminder({chat, meetingTime})

      if (!notificationId) {
        console.log(
          '[TradeReminder] No notification scheduled (time in past), cleaning up',
          {chatId: chat.id}
        )
        // Notification time is in the past, just remove any existing reminder
        if (existingReminder) {
          set(tradeRemindersAtom, {
            reminders: state.reminders.filter((r) => r.chatId !== chat.id),
          })
        }
        return
      }

      const newReminder: TradeReminder = {
        chatId: chat.id,
        notificationId,
        scheduledFor: (meetingTime - 1000 * 60 * 60) as UnixMilliseconds,
        meetingTime,
      }

      // Update storage
      if (existingReminder) {
        console.log('[TradeReminder] Updated existing reminder in storage', {
          chatId: chat.id,
          notificationId,
        })
        set(tradeRemindersAtom, {
          reminders: state.reminders.map((r) =>
            r.chatId === chat.id ? newReminder : r
          ),
        })
      } else {
        console.log('[TradeReminder] Added new reminder to storage', {
          chatId: chat.id,
          notificationId,
        })
        set(tradeRemindersAtom, {
          reminders: [...state.reminders, newReminder],
        })
      }
    } catch (error) {
      reportError('warn', new Error('Failed to schedule trade reminder'), {
        error,
      })
    }
  }
)
