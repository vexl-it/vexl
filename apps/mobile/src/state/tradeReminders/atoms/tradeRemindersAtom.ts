import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {TradeRemindersState, TradeRemindersState0} from '../domain'

const tradeRemindersAtom = atomWithParsedMmkvStorageE(
  'tradeReminders',
  TradeRemindersState0,
  TradeRemindersState
)

export default tradeRemindersAtom
