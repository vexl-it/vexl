import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'

export interface TradingChecklistSuggestion {
  type: 'tradeChecklistSuggestion'
  date: UnixMilliseconds
}
