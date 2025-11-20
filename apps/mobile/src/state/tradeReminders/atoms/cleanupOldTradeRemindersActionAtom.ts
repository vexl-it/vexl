import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {atom} from 'jotai'
import {cancelTradeReminder} from '../../../utils/notifications/tradeReminderNotifications'
import reportError from '../../../utils/reportError'
import messagingStateAtom from '../../chat/atoms/messagingStateAtom'
import tradeRemindersAtom from './tradeRemindersAtom'

export const cleanupOldTradeRemindersActionAtom = atom(
  null,
  async (get, set) => {
    try {
      const state = get(tradeRemindersAtom)
      const messagingState = get(messagingStateAtom)

      // Get all chat IDs from all inboxes
      const existingChatIds = new Set<string>(
        messagingState.flatMap((inbox) =>
          inbox.chats.map((chat) => chat.chat.id as string)
        )
      )
      const now = unixMillisecondsNow()

      const remindersToRemove = state.reminders.filter(
        (reminder) =>
          // Remove if chat doesn't exist anymore
          !existingChatIds.has(reminder.chatId) ||
          // Remove if meeting time has passed
          reminder.meetingTime < now
      )

      if (remindersToRemove.length === 0) {
        return
      }

      // Cancel all notifications for removed reminders
      await Promise.all(
        remindersToRemove.map(async (reminder) => {
          try {
            await cancelTradeReminder(reminder.notificationId)
          } catch (error) {
            // Log but don't fail the whole cleanup if one notification fails
            reportError(
              'warn',
              new Error('Failed to cancel notification during cleanup'),
              {error, notificationId: reminder.notificationId}
            )
          }
        })
      )

      // Update storage
      const reminderIdsToRemove = new Set(
        remindersToRemove.map((r) => r.notificationId)
      )
      set(tradeRemindersAtom, {
        reminders: state.reminders.filter(
          (r) => !reminderIdsToRemove.has(r.notificationId)
        ),
      })
    } catch (error) {
      reportError('warn', new Error('Failed to cleanup old trade reminders'), {
        error,
      })
    }
  }
)
