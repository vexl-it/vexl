import {Either, Schema} from 'effect/index'
import {BtcAddress} from '../utility/BtcAddress.brand'
import {Latitude, Longitude} from '../utility/geoCoordinates'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {UriString} from '../utility/UriString.brand'
import {generateUuid} from '../utility/Uuid.brand'
import {CurrencyCode} from './currency.brand'
import {DeanonymizedUser} from './DeanonymizedUser'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {BtcNetwork, LocationPlaceId} from './offers'
import {UserName} from './UserName.brand'

export const TradeChecklistItemStatus = Schema.Literal(
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
  'initial'
)
export type TradeChecklistItemStatus = typeof TradeChecklistItemStatus.Type

export const TradeChecklistStateItemStateE = Schema.Struct({
  status: TradeChecklistItemStatus,
})
export type TradeChecklistStateItemStatus =
  typeof TradeChecklistStateItemStateE.Type

export const AvailableDateTimeOption = Schema.Struct({
  date: UnixMilliseconds,
  from: UnixMilliseconds,
  to: UnixMilliseconds,
})
export type AvailableDateTimeOption = typeof AvailableDateTimeOption.Type

export const PickedDateTimeOption = Schema.Struct({
  dateTime: UnixMilliseconds,
})
export type PickedDateTimeOption = typeof PickedDateTimeOption.Type

export const NetworkData = Schema.Struct({
  btcNetwork: Schema.optional(BtcNetwork),
  btcAddress: Schema.optional(BtcAddress),
})
export type NetworkData = typeof NetworkData.Type

export const RevealStatus = Schema.Literal(
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL'
)
export type RevealStatus = typeof RevealStatus.Type

export const IdentityReveal = Schema.Struct({
  status: Schema.optional(RevealStatus),
  image: Schema.optional(UriString),
  name: Schema.optional(UserName),
  partialPhoneNumber: Schema.optional(Schema.String),
  deanonymizedUser: Schema.optional(DeanonymizedUser),
})
export type IdentityReveal = typeof IdentityReveal.Type

export const ContactReveal = Schema.Struct({
  status: Schema.optional(RevealStatus),
  fullPhoneNumber: Schema.optional(E164PhoneNumber),
})
export type ContactReveal = typeof ContactReveal.Type

export const TradePriceType = Schema.Literal('live', 'custom', 'frozen', 'your')
export type TradePriceType = typeof TradePriceType.Type

export const BtcOrSat = Schema.Literal('BTC', 'SAT')
export type BtcOrSat = typeof BtcOrSat.Type

export const AmountData = Schema.Struct({
  tradePriceType: Schema.optional(TradePriceType),
  btcPrice: Schema.optional(Schema.Number),
  btcAmount: Schema.optional(Schema.Number),
  fiatAmount: Schema.optional(Schema.Number),
  feeAmount: Schema.optional(Schema.Number),
  currency: Schema.optional(CurrencyCode),
})
export type AmountData = typeof AmountData.Type

export const TradeChecklistMessageBase = Schema.Struct({
  timestamp: UnixMilliseconds,
})
export type TradeChecklistMessageBase = typeof TradeChecklistMessageBase.Type

export const DateTimeChatMessage = Schema.Struct({
  ...TradeChecklistMessageBase.fields,
  suggestions: Schema.optional(
    Schema.Array(AvailableDateTimeOption).pipe(Schema.mutable)
  ),
  picks: Schema.optional(PickedDateTimeOption),
})
export type DateTimeChatMessage = typeof DateTimeChatMessage.Type

export const AmountChatMessage = Schema.Struct({
  ...TradeChecklistMessageBase.fields,
  ...AmountData.fields,
})
export type AmountChatMessage = typeof AmountChatMessage.Type

export const NetworkChatMessage = Schema.Struct({
  ...TradeChecklistMessageBase.fields,
  ...NetworkData.fields,
})
export type NetworkChatMessage = typeof NetworkChatMessage.Type

export const IdentityRevealChatMessage = Schema.Struct({
  ...TradeChecklistMessageBase.fields,
  ...IdentityReveal.fields,
})
export type IdentityRevealChatMessage = typeof IdentityRevealChatMessage.Type

export const ContactRevealChatMessage = Schema.Struct({
  ...TradeChecklistMessageBase.fields,
  ...ContactReveal.fields,
})
export type ContactRevealChatMessage = typeof ContactRevealChatMessage.Type

export const MeetingLocationData = Schema.Struct({
  placeId: LocationPlaceId.pipe(
    Schema.annotations({
      decodingFallback: () =>
        Either.right(Schema.decodeSync(LocationPlaceId)(generateUuid())),
    })
  ),
  address: Schema.String,
  latitude: Latitude,
  longitude: Longitude,
  viewport: Schema.Struct({
    northeast: Schema.Struct({
      latitude: Latitude,
      longitude: Longitude,
    }),
    southwest: Schema.Struct({
      latitude: Latitude,
      longitude: Longitude,
    }),
  }),
  note: Schema.optional(Schema.String),
})
export type MeetingLocationData = typeof MeetingLocationData.Type

export const MeetingLocationChatMessage = Schema.Struct({
  ...TradeChecklistMessageBase.fields,
  data: MeetingLocationData,
})
export type MeetingLocationChatMessage = typeof MeetingLocationChatMessage.Type

export const TradeChecklistUpdate = Schema.Struct({
  dateAndTime: Schema.optional(DateTimeChatMessage),
  location: Schema.optional(MeetingLocationChatMessage),
  amount: Schema.optional(AmountChatMessage),
  network: Schema.optional(NetworkChatMessage),
  identity: Schema.optional(IdentityRevealChatMessage),
  contact: Schema.optional(ContactRevealChatMessage),
})
export type TradeChecklistUpdate = typeof TradeChecklistUpdate.Type
