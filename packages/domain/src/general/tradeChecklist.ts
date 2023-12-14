import {z} from 'zod'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {BtcNetwork} from './offers'
import {BtcAddress} from '../utility/BtcAddress.brand'

/**
 * TODO move to apps/mobile
 */
export const TradeChecklistItemStatus = z.enum([
  /**
   * Ready to be sent to the other side
   */
  'readyToSend',
  /**
   * Waiting for response from the other side
   */
  'pending',
  /**
   * Other side accepted the item
   */
  'accepted',
  /**
   * Initial state
   */
  'initial',
])
export type TradeChecklistItemStatus = z.TypeOf<typeof TradeChecklistItemStatus>

export const TradeChecklistStateItemStatus = z.object({
  status: TradeChecklistItemStatus,
})
export type TradeChecklistStateItemStatus = z.TypeOf<
  typeof TradeChecklistStateItemStatus
>

export const AvailableDateTimeOption = z.object({
  date: UnixMilliseconds,
  from: UnixMilliseconds,
  to: UnixMilliseconds,
})
export type AvailableDateTimeOption = z.TypeOf<typeof AvailableDateTimeOption>

export const PickedDateTimeOption = z.object({
  dateTime: UnixMilliseconds,
})
export type PickedDateTimeOption = z.TypeOf<typeof PickedDateTimeOption>

export const NetworkData = z.object({
  btcNetwork: BtcNetwork.optional(),
  btcAddress: BtcAddress.optional(),
})
export type NetworkData = z.TypeOf<typeof NetworkData>

export const TradeChecklistMessageBase = z.object({
  timestamp: UnixMilliseconds,
})
export type TradeChecklistMessageBase = z.TypeOf<
  typeof TradeChecklistMessageBase
>

export const DateTimeChatMessage = TradeChecklistMessageBase.extend({
  suggestions: z.array(AvailableDateTimeOption).optional(),
  picks: PickedDateTimeOption.optional(),
})
export type DateTimeChatMessage = z.TypeOf<typeof DateTimeChatMessage>

export const NetworkChatMessage = TradeChecklistMessageBase.merge(NetworkData)
export type NetworkChatMessage = z.TypeOf<typeof NetworkChatMessage>

export const TradeChecklistUpdate = z.object({
  dateAndTime: DateTimeChatMessage.optional(),
  location: z.object({}).optional(),
  amount: z.object({}).optional(),
  network: NetworkChatMessage.optional(),
  identity: z.object({}).optional(),
})
export type TradeChecklistUpdate = z.TypeOf<typeof TradeChecklistUpdate>
