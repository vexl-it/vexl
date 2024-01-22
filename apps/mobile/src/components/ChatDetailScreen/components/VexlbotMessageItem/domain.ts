import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'

export interface TradingChecklistSuggestion {
  type: 'tradeChecklistSuggestion'
  date: UnixMilliseconds
}

export interface TradingChecklistDateAndTimePreview {
  type: 'dateAndTimePreview'
  date: UnixMilliseconds
}

export interface TradingChecklistMeetingLocationSuggestionPreview {
  type: 'meetingLocationSuggestionPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistMeetingLocationPreview {
  type: 'meetingLocationPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistAmountSuggestionPreview {
  type: 'amountSuggestionPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistAmountPreview {
  type: 'amountPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistNetworkSuggestionPreview {
  type: 'networkSuggestionPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistNetworkPreview {
  type: 'networkPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistIdentityRevealPreview {
  type: 'identityRevealPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistContactRevealPreview {
  type: 'contactRevealPreview'
  date: UnixMilliseconds
}

export interface TradingChecklistAllSetPreview {
  type: 'allSetPreview'
  date: UnixMilliseconds
}

export type VexlBotMessageData =
  | TradingChecklistSuggestion
  | TradingChecklistDateAndTimePreview
  | TradingChecklistMeetingLocationSuggestionPreview
  | TradingChecklistMeetingLocationPreview
  | TradingChecklistAmountSuggestionPreview
  | TradingChecklistAmountPreview
  | TradingChecklistNetworkSuggestionPreview
  | TradingChecklistNetworkPreview
  | TradingChecklistIdentityRevealPreview
  | TradingChecklistContactRevealPreview
  | TradingChecklistAllSetPreview
