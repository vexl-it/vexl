import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {TradeRemindersState, TradeRemindersState0} from '../domain'

// Policy 'rebuild': logical chat/meeting/reminder times migrate, but the
// source OS notification identifiers never do — local notifications are
// rescheduled on the destination after activation.
const tradeRemindersAtom = atomWithParsedMmkvStorage(
  'tradeReminders',
  TradeRemindersState0,
  TradeRemindersState,
  'rebuild'
)

export default tradeRemindersAtom
