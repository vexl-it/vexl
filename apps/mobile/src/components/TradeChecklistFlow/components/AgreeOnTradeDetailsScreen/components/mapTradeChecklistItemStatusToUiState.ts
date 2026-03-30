import {type TradeChecklistItemStatus} from '@vexl-next/domain/src/general/tradeChecklist'
import {type ChecklistCellState} from '@vexl-next/ui'

export default function mapTradeChecklistItemStatusToUiState(
  status: TradeChecklistItemStatus
): ChecklistCellState {
  if (status === 'accepted') return 'completed'
  if (status === 'pending' || status === 'readyToSend') return 'pending'
  return 'initial'
}
