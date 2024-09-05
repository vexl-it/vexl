import {Schema} from '@effect/schema'
import {z} from 'zod'
import {BtcAddress, BtcAddressE} from '../utility/BtcAddress.brand'
import {
  UnixMilliseconds,
  UnixMillisecondsE,
} from '../utility/UnixMilliseconds.brand'
import {UriString, UriStringE} from '../utility/UriString.brand'
import {generateUuid} from '../utility/Uuid.brand'
import {
  Latitude,
  LatitudeE,
  Longitude,
  LongitudeE,
} from '../utility/geoCoordinates'
import {DeanonymizedUser, DeanonymizedUserE} from './DeanonymizedUser'
import {E164PhoneNumber, E164PhoneNumberE} from './E164PhoneNumber.brand'
import {UserName, UserNameE} from './UserName.brand'
import {CurrencyCodeE} from './currency.brand'
import {
  BtcNetwork,
  BtcNetworkE,
  CurrencyCode,
  LocationPlaceId,
  LocationPlaceIdE,
} from './offers'

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
export const TradeChecklistItemStatusE = Schema.Literal(
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
export type TradeChecklistItemStatus = Schema.Schema.Type<
  typeof TradeChecklistItemStatusE
>

export const TradeChecklistStateItemStatus = z
  .object({
    status: TradeChecklistItemStatus,
  })
  .readonly()
export const TradeChecklistStateItemStateE = Schema.Struct({
  status: TradeChecklistItemStatusE,
})
export type TradeChecklistStateItemStatus = Schema.Schema.Type<
  typeof TradeChecklistStateItemStateE
>

export const AvailableDateTimeOption = z
  .object({
    date: UnixMilliseconds,
    from: UnixMilliseconds,
    to: UnixMilliseconds,
  })
  .readonly()
export const AvailableDateTimeOptionE = Schema.Struct({
  date: UnixMillisecondsE,
  from: UnixMillisecondsE,
  to: UnixMillisecondsE,
})
export type AvailableDateTimeOption = Schema.Schema.Type<
  typeof AvailableDateTimeOptionE
>

export const PickedDateTimeOption = z
  .object({
    dateTime: UnixMilliseconds,
  })
  .readonly()
export const PickedDateTimeOptionE = Schema.Struct({
  dateTime: UnixMillisecondsE,
})
export type PickedDateTimeOption = Schema.Schema.Type<
  typeof PickedDateTimeOptionE
>

export const NetworkData = z.object({
  btcNetwork: BtcNetwork.optional(),
  btcAddress: BtcAddress.optional(),
})
export const NetworkDataE = Schema.Struct({
  btcNetwork: Schema.optional(BtcNetworkE),
  btcAddress: Schema.optional(BtcAddressE),
})
export type NetworkData = z.TypeOf<typeof NetworkData>

export const RevealStatus = z.enum([
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL',
])
export const RevealStatusE = Schema.Literal(
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL'
)
export type RevealStatus = Schema.Schema.Type<typeof RevealStatusE>

export const IdentityReveal = z.object({
  status: RevealStatus.optional(),
  image: UriString.optional(),
  name: UserName.optional(),
  partialPhoneNumber: z.string().optional(),
  deanonymizedUser: DeanonymizedUser.optional(),
})
export const IdentityRevealE = Schema.Struct({
  status: Schema.optional(RevealStatusE),
  image: Schema.optional(UriStringE),
  name: Schema.optional(UserNameE),
  partialPhoneNumber: Schema.optional(Schema.String),
  deanonymizedUser: Schema.optional(DeanonymizedUserE),
})
export type IdentityReveal = Schema.Schema.Type<typeof IdentityRevealE>

export const ContactReveal = z.object({
  status: RevealStatus.optional(),
  fullPhoneNumber: E164PhoneNumber.optional(),
})
export const ContactRevealE = Schema.Struct({
  status: Schema.optional(RevealStatusE),
  fullPhoneNumber: Schema.optional(E164PhoneNumberE),
})
export type ContactReveal = Schema.Schema.Type<typeof ContactRevealE>

export const TradePriceType = z.enum(['live', 'custom', 'frozen', 'your'])
export const TradePriceTypeE = Schema.Literal(
  'live',
  'custom',
  'frozen',
  'your'
)
export type TradePriceType = Schema.Schema.Type<typeof TradePriceTypeE>

export const BtcOrSat = z.enum(['BTC', 'SAT'])
export const BtcOrSatE = Schema.Literal('BTC', 'SAT')
export type BtcOrSat = Schema.Schema.Type<typeof BtcOrSatE>

export const AmountData = z.object({
  tradePriceType: TradePriceType.optional(),
  btcPrice: z.coerce.number().optional(),
  btcAmount: z.coerce.number().optional(),
  fiatAmount: z.coerce.number().optional(),
  feeAmount: z.coerce.number().optional(),
  currency: CurrencyCode.optional(),
})
export const AmountDataE = Schema.Struct({
  tradePriceType: Schema.optional(TradePriceTypeE),
  btcPrice: Schema.optional(Schema.Number),
  btcAmount: Schema.optional(Schema.Number),
  fiatAmount: Schema.optional(Schema.Number),
  feeAmount: Schema.optional(Schema.Number),
  currency: Schema.optional(CurrencyCodeE),
}) // Needed for the zod definition to work properly
export type AmountData = Schema.Schema.Type<typeof AmountDataE>

const TradeChecklistMessageBase = z.object({
  timestamp: UnixMilliseconds,
})
export const TradeChecklistMessageBaseE = Schema.Struct({
  timestamp: UnixMillisecondsE,
})
export type TradeChecklistMessageBase = Schema.Schema.Type<
  typeof TradeChecklistMessageBaseE
>

export const DateTimeChatMessage = TradeChecklistMessageBase.extend({
  suggestions: z.array(AvailableDateTimeOption).optional(),
  picks: PickedDateTimeOption.optional(),
}).readonly()
export const DateTimeChatMessageE = Schema.Struct({
  ...TradeChecklistMessageBaseE.fields,
  suggestions: Schema.optional(
    Schema.Array(AvailableDateTimeOptionE).pipe(
      // Weird zod schema error here. This fixes it...
      Schema.mutable
    )
  ),
  picks: Schema.optional(PickedDateTimeOptionE),
})
export type DateTimeChatMessage = Schema.Schema.Type<
  typeof DateTimeChatMessageE
>

export const AmountChatMessage =
  TradeChecklistMessageBase.merge(AmountData).readonly()
export const AmountChatMessageE = Schema.Struct({
  ...TradeChecklistMessageBaseE.fields,
  ...AmountDataE.fields,
})
export type AmountChatMessage = Schema.Schema.Type<typeof AmountChatMessageE>

export const NetworkChatMessage =
  TradeChecklistMessageBase.merge(NetworkData).readonly()
export const NetworkChatMessageE = Schema.Struct({
  ...TradeChecklistMessageBaseE.fields,
  ...NetworkDataE.fields,
})
export type NetworkChatMessage = Schema.Schema.Type<typeof NetworkChatMessageE>

export const IdentityRevealChatMessage =
  TradeChecklistMessageBase.merge(IdentityReveal).readonly()

export const IdentityRevealChatMessageE = Schema.Struct({
  ...TradeChecklistMessageBaseE.fields,
  ...IdentityRevealE.fields,
})
export type IdentityRevealChatMessage = Schema.Schema.Type<
  typeof IdentityRevealChatMessageE
>

export const ContactRevealChatMessage =
  TradeChecklistMessageBase.merge(ContactReveal).readonly()
export const ContactRevealChatMessageE = Schema.Struct({
  ...TradeChecklistMessageBaseE.fields,
  ...ContactRevealE.fields,
})
export type ContactRevealChatMessage = Schema.Schema.Type<
  typeof ContactRevealChatMessageE
>

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
export const MeetingLocationDataE = Schema.Struct({
  placeId: LocationPlaceIdE, // TODO do we need to generate uuid in catch here?
  address: Schema.String,
  latitude: LatitudeE,
  longitude: LongitudeE,
  viewport: Schema.Struct({
    northeast: Schema.Struct({
      latitude: LatitudeE,
      longitude: LongitudeE,
    }),
    southwest: Schema.Struct({
      latitude: LatitudeE,
      longitude: LongitudeE,
    }),
  }),
  note: Schema.optional(Schema.String),
})
export type MeetingLocationData = Schema.Schema.Type<
  typeof MeetingLocationDataE
>

export const MeetingLocationChatMessage = TradeChecklistMessageBase.extend({
  data: MeetingLocationData,
})
export const MeetingLocationChatMessageE = Schema.Struct({
  ...TradeChecklistMessageBaseE.fields,
  data: MeetingLocationDataE,
})
export type MeetingLocationChatMessage = Schema.Schema.Type<
  typeof MeetingLocationChatMessageE
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

export const TradeChecklistUpdateE = Schema.Struct({
  dateAndTime: Schema.optional(DateTimeChatMessageE),
  location: Schema.optional(MeetingLocationChatMessageE),
  amount: Schema.optional(AmountChatMessageE),
  network: Schema.optional(NetworkChatMessageE),
  identity: Schema.optional(IdentityRevealChatMessageE),
  contact: Schema.optional(ContactRevealChatMessageE),
})

export type TradeChecklistUpdate = Schema.Schema.Type<
  typeof TradeChecklistUpdateE
>
