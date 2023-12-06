import {type Atom, atom} from 'jotai'
import {tradeChecklistDataAtom} from './fromChatAtoms'
import updatesToBeSentAtom from './updatesToBeSentAtom'
import {type TradeChecklistItem} from '../domain'
import {type TradeChecklistItemStatus} from '@vexl-next/domain/dist/general/tradeChecklist'
import * as DateAndTime from '../../../state/tradeChecklist/utils/dateAndTime'

export default function createChecklistItemStatusAtom(
  item: TradeChecklistItem
): Atom<TradeChecklistItemStatus> {
  return atom((get) => {
    const tradeChecklistData = get(tradeChecklistDataAtom)
    const updates = get(updatesToBeSentAtom)

    if (item === 'DATE_AND_TIME') {
      const dateAndTime = tradeChecklistData.dateAndTime
      const picks = DateAndTime.getPick(dateAndTime)

      if (updates.dateAndTime) return 'readyToSend'

      if (picks) return 'pending'

      const suggestions = DateAndTime.getSuggestions(dateAndTime)
      if (suggestions) return 'pending'
      return 'initial'
    }

    return 'initial'
  })
}
