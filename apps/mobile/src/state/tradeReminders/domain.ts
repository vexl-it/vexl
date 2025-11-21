import {ChatIdE} from '@vexl-next/domain/src/general/messaging'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export const TradeReminderRecordE = Schema.Struct({
  chatId: ChatIdE,
  notificationId: Schema.String,
  scheduledFor: UnixMillisecondsE,
  meetingTime: UnixMillisecondsE,
})

export type TradeReminderRecord = typeof TradeReminderRecordE.Type
