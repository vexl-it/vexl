import {z} from 'zod'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'

export const TradeChecklistItemStatus = z.enum([
  'pending',
  'accepted',
  'unknown',
])
export type TradeChecklistItemStatus = z.TypeOf<typeof TradeChecklistItemStatus>

export const TradeChecklistItem = z.enum([
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY',
  'REVEAL_PHONE_NUMBER',
])
export type TradeChecklistItem = z.TypeOf<typeof TradeChecklistItem>

export const AvailableDateTimeOption = z.object({
  date: UnixMilliseconds,
  from: UnixMilliseconds,
  to: UnixMilliseconds,
})
export type AvailableDateTimeOption = z.TypeOf<typeof AvailableDateTimeOption>
export const TradeChecklistStateItemStatus = z.object({
  status: TradeChecklistItemStatus,
})

export const TradePriceType = z.enum(['live', 'custom', 'frozen', 'your'])
export type TradePriceType = z.TypeOf<typeof TradePriceType>

export const BtcOrSat = z.enum(['BTC', 'SAT'])
export type BtcOrSat = z.TypeOf<typeof BtcOrSat>

export const DateAndTimeState = TradeChecklistStateItemStatus.extend({
  data: z.array(AvailableDateTimeOption).default([]),
})
export type DateAndTimeState = z.TypeOf<typeof DateAndTimeState>

export const CalculateAmountState = TradeChecklistStateItemStatus.extend({
  tradePriceType: TradePriceType,
  btcOrSat: BtcOrSat,
  btcPrice: z.coerce.number(),
  btcAmount: z.coerce.number(),
  fiatAmount: z.coerce.number(),
  feeAmount: z.coerce.number(),
})
export type CalculateAmountState = z.TypeOf<typeof CalculateAmountState>

export const MainTradeCheckListState = z.object({
  [TradeChecklistItem.enum.DATE_AND_TIME]: DateAndTimeState,
  [TradeChecklistItem.enum.MEETING_LOCATION]: TradeChecklistStateItemStatus,
  [TradeChecklistItem.enum.CALCULATE_AMOUNT]: CalculateAmountState,
  [TradeChecklistItem.enum.SET_NETWORK]: TradeChecklistStateItemStatus,
  [TradeChecklistItem.enum.REVEAL_IDENTITY]: TradeChecklistStateItemStatus,
  [TradeChecklistItem.enum.REVEAL_PHONE_NUMBER]: TradeChecklistStateItemStatus,
})
export type MainTradeCheckListState = z.TypeOf<typeof MainTradeCheckListState>
