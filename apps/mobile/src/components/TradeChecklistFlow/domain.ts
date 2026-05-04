import {type RevealStatus} from '@vexl-next/domain/src/general/tradeChecklist'
import {Schema} from 'effect/index'

export const TradeChecklistItem = Schema.Literal(
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY',
  'REVEAL_PHONE_NUMBER'
)
export type TradeChecklistItem = typeof TradeChecklistItem.Type

export type RevealMessageType = RevealStatus
export type TradeChecklistRevealIntent = 'request' | 'respond'
export interface AutoOpenTradeChecklistReveal {
  readonly item: 'REVEAL_IDENTITY' | 'REVEAL_PHONE_NUMBER'
  readonly intent: TradeChecklistRevealIntent
}
