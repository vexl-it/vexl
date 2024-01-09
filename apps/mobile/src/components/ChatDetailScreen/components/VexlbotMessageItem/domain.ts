import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'

export interface TradingChecklistSuggestion {
  type: 'tradeChecklistSuggestion'
  date: UnixMilliseconds
}

export interface TradingChecklistDateAndTimePreview {
  type: 'dateAndTimePreview'
  date: UnixMilliseconds
}

export interface TradingChecklistAmountPreview {
  type: 'amountPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistNetworkPreview {
  type: 'networkPreview'
  date: UnixMilliseconds
}

// TODO more trading messages

export type VexlBotMessageData =
  | TradingChecklistSuggestion
  | TradingChecklistDateAndTimePreview
  | TradingChecklistAmountPreview
  | TradingChecklistNetworkPreview
