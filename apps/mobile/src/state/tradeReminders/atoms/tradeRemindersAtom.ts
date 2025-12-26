import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {TradeRemindersState, TradeRemindersState0} from '../domain'

const tradeRemindersAtom = atomWithParsedMmkvStorage(
  'tradeReminders',
  TradeRemindersState0,
  TradeRemindersState
)

export default tradeRemindersAtom
