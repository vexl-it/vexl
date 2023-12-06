import {type UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'

export interface TradingChecklistSuggestion {
  type: 'tradeChecklistSuggestion'
  date: UnixMilliseconds
}

export interface TradingChecklistDateAndTimePreview {
  type: 'dateAndTimePreview'
  date: UnixMilliseconds
}

// TODO more trading messages

export type VexlBotMessageData =
  | TradingChecklistSuggestion
  | TradingChecklistDateAndTimePreview
