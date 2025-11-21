import {Schema} from 'effect'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {TradeReminderRecordE} from '../domain'

const tradeRemindersStorageAtom = atomWithParsedMmkvStorageE(
  'tradeReminders',
  {reminders: []},
  Schema.Struct({
    reminders: Schema.Array(TradeReminderRecordE),
  })
)

export const tradeRemindersAtom = focusAtom(
  tradeRemindersStorageAtom,
  (optic) => optic.prop('reminders')
)

export default tradeRemindersAtom
