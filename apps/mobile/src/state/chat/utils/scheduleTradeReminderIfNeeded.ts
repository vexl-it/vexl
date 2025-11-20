import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {getDefaultStore} from 'jotai'
import * as dateAndTime from '../../tradeChecklist/utils/dateAndTime'
import {cancelTradeReminderActionAtom} from '../../tradeReminders/atoms/cancelTradeReminderActionAtom'
import {scheduleTradeReminderActionAtom} from '../../tradeReminders/atoms/scheduleTradeReminderActionAtom'
import {type ChatWithMessages} from '../domain'

/**
 * Schedules a trade reminder notification if the trade checklist has an agreed date/time.
 * Similar to addIdentityRealLifeInfoToChat, this function is used in the message processing pipeline.
 * Only triggers when there are trade checklist updates with date/time information.
 */
export function scheduleTradeReminderIfNeeded(
  tradeChecklistUpdates: TradeChecklistUpdate[]
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    // Only process if there are date/time updates
    const hasDateTimeUpdate = tradeChecklistUpdates.some(
      (update) => update.dateAndTime
    )

    if (!hasDateTimeUpdate) {
      return chat
    }

    console.log(
      '[TradeReminder] Processing trade checklist updates with date/time',
      {
        chatId: chat.chat.id,
        updateCount: tradeChecklistUpdates.length,
      }
    )

    // Check if there's an agreed upon date/time after applying all updates
    const pick = dateAndTime.getPick(chat.tradeChecklist.dateAndTime)

    if (pick) {
      const meetingTime = pick.pick.dateTime

      console.log('[TradeReminder] Date/time agreed, triggering scheduling', {
        chatId: chat.chat.id,
        meetingTime,
        agreedBy: pick.by,
      })

      // Schedule the notification asynchronously (side effect)
      void getDefaultStore().set(scheduleTradeReminderActionAtom, {
        chat: chat.chat,
        meetingTime,
      })
    } else {
      console.log(
        '[TradeReminder] No agreed date/time (cancelled or not yet agreed), cancelling any existing notification',
        {
          chatId: chat.chat.id,
        }
      )

      // Cancel any existing notification since the agreement was cancelled
      void getDefaultStore().set(cancelTradeReminderActionAtom, chat.chat.id)
    }

    // Return chat unchanged (scheduling is a side effect)
    return chat
  }
}
