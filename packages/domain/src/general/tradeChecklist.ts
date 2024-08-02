import {z} from 'zod'
import {BtcAddress} from '../utility/BtcAddress.brand'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {UriString} from '../utility/UriString.brand'
import {generateUuid} from '../utility/Uuid.brand'
import {Latitude, Longitude} from '../utility/geoCoordinates'
import {DeanonymizedUser} from './DeanonymizedUser'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {UserName} from './UserName.brand'
import {BtcNetwork, CurrencyCode, LocationPlaceId} from './offers'

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
   * Other side suggestion is in conflict with yours
   */
  'warning',
  /**
   * Other side declined reveal identity or phone number
   */
  'declined',
  /**
   * Initial state
   */
  'initial',
])
export type TradeChecklistItemStatus = z.TypeOf<typeof TradeChecklistItemStatus>

export const TradeChecklistStateItemStatus = z
  .object({
    status: TradeChecklistItemStatus,
  })
  .readonly()
export type TradeChecklistStateItemStatus = z.TypeOf<
  typeof TradeChecklistStateItemStatus
>

export const AvailableDateTimeOption = z
  .object({
    date: UnixMilliseconds,
    from: UnixMilliseconds,
    to: UnixMilliseconds,
  })
  .readonly()
export type AvailableDateTimeOption = z.TypeOf<typeof AvailableDateTimeOption>

export const PickedDateTimeOption = z
  .object({
    dateTime: UnixMilliseconds,
  })
  .readonly()
export type PickedDateTimeOption = z.TypeOf<typeof PickedDateTimeOption>

export const NetworkData = z.object({
  btcNetwork: BtcNetwork.optional(),
  btcAddress: BtcAddress.optional(),
})

export type NetworkData = z.TypeOf<typeof NetworkData>

export const RevealStatus = z.enum([
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL',
])

export type RevealStatus = z.TypeOf<typeof RevealStatus>

export const IdentityReveal = z.object({
  status: RevealStatus.optional(),
  image: UriString.optional(),
  name: UserName.optional(),
  partialPhoneNumber: z.string().optional(),
  deanonymizedUser: DeanonymizedUser.optional(),
})

export type IdentityReveal = z.TypeOf<typeof IdentityReveal>

export const ContactReveal = z.object({
  status: RevealStatus.optional(),
  fullPhoneNumber: E164PhoneNumber.optional(),
})
export type ContactReveal = z.TypeOf<typeof ContactReveal>

export const TradePriceType = z.enum(['live', 'custom', 'frozen', 'your'])
export type TradePriceType = z.TypeOf<typeof TradePriceType>

export const BtcOrSat = z.enum(['BTC', 'SAT'])
export type BtcOrSat = z.TypeOf<typeof BtcOrSat>

export const AmountData = z.object({
  tradePriceType: TradePriceType.optional(),
  btcPrice: z.coerce.number().optional(),
  btcAmount: z.coerce.number().optional(),
  fiatAmount: z.coerce.number().optional(),
  feeAmount: z.coerce.number().optional(),
  currency: CurrencyCode.optional(),
})
export type AmountData = z.TypeOf<typeof AmountData>

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

export const AmountChatMessage =
  TradeChecklistMessageBase.merge(AmountData).readonly()
export type AmountChatMessage = z.TypeOf<typeof AmountChatMessage>

export const NetworkChatMessage =
  TradeChecklistMessageBase.merge(NetworkData).readonly()
export type NetworkChatMessage = z.TypeOf<typeof NetworkChatMessage>

export const IdentityRevealChatMessage =
  TradeChecklistMessageBase.merge(IdentityReveal).readonly()
export type IdentityRevealChatMessage = z.TypeOf<
  typeof IdentityRevealChatMessage
>

export const ContactRevealChatMessage =
  TradeChecklistMessageBase.merge(ContactReveal).readonly()
export type ContactRevealChatMessage = z.TypeOf<typeof ContactRevealChatMessage>

export const MeetingLocationData = z
  .object({
    placeId: LocationPlaceId.catch((e) =>
      LocationPlaceId.parse(generateUuid())
    ),
    address: z.string(),
    latitude: Latitude,
    longitude: Longitude,
    viewport: z.object({
      northeast: z.object({
        latitude: Latitude,
        longitude: Longitude,
      }),
      southwest: z.object({
        latitude: Latitude,
        longitude: Longitude,
      }),
    }),
    note: z.string().optional(),
  })
  .readonly()
export type MeetingLocationData = z.TypeOf<typeof MeetingLocationData>

export const MeetingLocationChatMessage = TradeChecklistMessageBase.extend({
  data: MeetingLocationData,
})
export type MeetingLocationChatMessage = z.TypeOf<
  typeof MeetingLocationChatMessage
>

export const TradeChecklistUpdate = z
  .object({
    dateAndTime: DateTimeChatMessage.optional(),
    location: MeetingLocationChatMessage.optional(),
    amount: AmountChatMessage.optional(),
    network: NetworkChatMessage.optional(),
    identity: IdentityRevealChatMessage.optional(),
    contact: ContactRevealChatMessage.optional(),
  })
  .readonly()
export type TradeChecklistUpdate = z.TypeOf<typeof TradeChecklistUpdate>
