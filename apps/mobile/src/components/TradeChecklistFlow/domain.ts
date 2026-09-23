import {Schema} from 'effect/index'

export const TradeChecklistItem = Schema.Literal(
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY'
)
export type TradeChecklistItem = typeof TradeChecklistItem.Type
