import {z} from 'zod'
import {BtcNetwork} from '@vexl-next/domain/dist/general/offers'
import {BtcAddress} from '@vexl-next/domain/dist/utility/BtcAddress.brand'
import {
  AvailableDateTimeOption,
  TradeChecklistStateItemStatus,
} from '@vexl-next/domain/dist/general/tradeChecklist'

export const TradeChecklistItem = z.enum([
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY',
  'REVEAL_PHONE_NUMBER',
])
export type TradeChecklistItem = z.TypeOf<typeof TradeChecklistItem>

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

export const NetworkState = TradeChecklistStateItemStatus.extend({
  btcNetwork: BtcNetwork,
  btcAddress: BtcAddress.optional(),
})
export type NetworkState = z.TypeOf<typeof NetworkState>

export const MainTradeCheckListState = z.object({
  [TradeChecklistItem.enum.DATE_AND_TIME]: DateAndTimeState,
  [TradeChecklistItem.enum.MEETING_LOCATION]: TradeChecklistStateItemStatus,
  [TradeChecklistItem.enum.CALCULATE_AMOUNT]: CalculateAmountState,
  [TradeChecklistItem.enum.SET_NETWORK]: NetworkState,
  [TradeChecklistItem.enum.REVEAL_IDENTITY]: TradeChecklistStateItemStatus,
  [TradeChecklistItem.enum.REVEAL_PHONE_NUMBER]: TradeChecklistStateItemStatus,
})
export type MainTradeCheckListState = z.TypeOf<typeof MainTradeCheckListState>
