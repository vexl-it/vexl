import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export const TradeReminder = Schema.Struct({
  chatId: Schema.String,
  notificationId: Schema.String,
  scheduledFor: UnixMillisecondsE,
  meetingTime: UnixMillisecondsE,
})

export type TradeReminder = Schema.Schema.Type<typeof TradeReminder>

export const TradeRemindersState = Schema.Struct({
  reminders: Schema.Array(TradeReminder),
})

export type TradeRemindersState = Schema.Schema.Type<typeof TradeRemindersState>

export const TradeRemindersState0: TradeRemindersState = {
  reminders: [],
}
