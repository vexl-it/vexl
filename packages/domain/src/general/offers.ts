import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Array, Either, Schema} from 'effect'
import {IdNumeric} from '../utility/IdNumeric'
import {IsoDatetimeString} from '../utility/IsoDatetimeString.brand'
import {JSDateString} from '../utility/JSDateString.brand'
import {SemverString} from '../utility/SmeverString.brand'
import {Latitude, Longitude, Radius} from '../utility/geoCoordinates'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'
import {ClubUuid} from './clubs'
import {CurrencyCode} from './currency.brand'
import {NotificationCypher} from './notifications/NotificationCypher.brand'
import {VexlNotificationToken} from './notifications/VexlNotificationToken'

export const Sort = Schema.Literal(
  'LOWEST_FEE_FIRST',
  'HIGHEST_FEE',
  'NEWEST_OFFER',
  'OLDEST_OFFER',
  'LOWEST_AMOUNT',
  'HIGHEST_AMOUNT',
  'MOST_CONNECTIONS'
)
export type Sort = typeof Sort.Type

export const OfferId = Schema.String.pipe(Schema.brand('OfferId'))
export type OfferId = typeof OfferId.Type

export const newOfferId = (): OfferId =>
  Schema.decodeSync(OfferId)(getCrypto().randomUUID())

export const OfferAdminId = Schema.String.pipe(Schema.brand('OfferAdminId'))
export type OfferAdminId = typeof OfferAdminId.Type

export function generateAdminId(): OfferAdminId {
  return Schema.decodeSync(OfferAdminId)(getCrypto().randomUUID())
}

export const LocationState = Schema.Literal('ONLINE', 'IN_PERSON')
export type LocationState = typeof LocationState.Type

export const PaymentMethod = Schema.Literal('CASH', 'REVOLUT', 'BANK')
export type PaymentMethod = typeof PaymentMethod.Type

export const FeeState = Schema.Literal('WITHOUT_FEE', 'WITH_FEE')
export type FeeState = typeof FeeState.Type

export const BtcNetwork = Schema.Literal('LIGHTING', 'ON_CHAIN')
export type BtcNetwork = typeof BtcNetwork.Type

export const OfferType = Schema.Literal('BUY', 'SELL')
export type OfferType = typeof OfferType.Type

export const ListingType = Schema.Literal('BITCOIN', 'PRODUCT', 'OTHER')
export type ListingType = typeof ListingType.Type

export const DeliveryMethod = Schema.Literal('PICKUP', 'DELIVERY')
export type DeliveryMethod = typeof DeliveryMethod.Type

export const SpokenLanguage = Schema.Literal(
  'ENG',
  'DEU',
  'CZE',
  'SVK',
  'PRT',
  'FRA',
  'ITA',
  'ESP',
  'BG'
).pipe(orElseSchema('ENG' as const))
export type SpokenLanguage = typeof SpokenLanguage.Type

export const FriendLevel = Schema.Literal(
  'FIRST_DEGREE',
  'SECOND_DEGREE',
  'CLUB',
  'NOT_SPECIFIED' // TODO remove this but make sure to not break parsing in newer versions
)
export type FriendLevel = typeof FriendLevel.Type

export const ActivePriceState = Schema.Literal(
  'NONE',
  'PRICE_IS_BELOW',
  'PRICE_IS_ABOVE'
)
export type ActivePriceState = typeof ActivePriceState.Type

export const LocationPlaceId = Schema.String.pipe(
  Schema.brand('LocationPlaceId')
)
export type LocationPlaceId = typeof LocationPlaceId.Type

export const OfferLocation = Schema.Struct({
  placeId: LocationPlaceId,
  latitude: Latitude,
  longitude: Longitude,
  radius: Radius,
  address: Schema.String,
  shortAddress: Schema.String,
})
export type OfferLocation = typeof OfferLocation.Type

export const LocationStateToArray = Schema.transform(
  Schema.Union(LocationState, Schema.Array(LocationState)),
  Schema.Array(LocationState),
  {
    strict: false,
    encode: (v) => v,
    decode: (oldValue) => {
      if (Array.isArray(oldValue)) {
        return oldValue
      }
      return [oldValue]
    },
  }
)
export type LocationStateToArray = typeof LocationStateToArray.Type

export const SymmetricKey = Schema.String.pipe(Schema.brand('SymmetricKey'))
export type SymmetricKey = typeof SymmetricKey.Type

export const IntendedConnectionLevel = Schema.Literal('FIRST', 'ALL')
export type IntendedConnectionLevel = typeof IntendedConnectionLevel.Type

export const GoldenAvatarType = Schema.Literal('BACKGROUND_AND_GLASSES')
export type GoldenAvatarType = typeof GoldenAvatarType.Type

export const PrivatePartRecordId = Schema.NumberFromString.pipe(
  Schema.brand('PrivatePartRecordId'),
  Schema.greaterThanOrEqualTo(0)
)
export type PrivatePartRecordId = typeof PrivatePartRecordId.Type

export const OfferPrivatePart = Schema.Struct({
  commonFriends: Schema.Array(HashedPhoneNumber),
  friendLevel: Schema.Array(FriendLevel),
  symmetricKey: SymmetricKey,
  clubIds: Schema.optionalWith(Schema.Array(ClubUuid), {
    default: () => [],
  }),
  // For admin only
  adminId: Schema.optional(OfferAdminId),
  intendedConnectionLevel: Schema.optional(IntendedConnectionLevel),
  intendedClubs: Schema.optional(Schema.Array(ClubUuid)),
})
export type OfferPrivatePart = typeof OfferPrivatePart.Type

const CoalesecedNumber = Schema.Union(Schema.Number, Schema.NumberFromString)

export const OfferPublicPart = Schema.Struct({
  offerPublicKey: PublicKeyPemBase64,
  location: Schema.Array(OfferLocation).pipe(
    Schema.annotations({decodingFallback: () => Either.right([])})
  ),
  offerDescription: Schema.String,
  amountBottomLimit: CoalesecedNumber,
  amountTopLimit: CoalesecedNumber,
  feeState: FeeState,
  feeAmount: CoalesecedNumber,
  locationState: LocationStateToArray.pipe(
    Schema.annotations({decodingFallback: () => Either.right([])})
  ),
  paymentMethod: Schema.Array(PaymentMethod),
  btcNetwork: Schema.Array(BtcNetwork),
  currency: CurrencyCode,
  spokenLanguages: Schema.Array(SpokenLanguage)
    // Otherwise split atom does not work...
    .pipe(Schema.mutable),
  expirationDate: Schema.optional(JSDateString),
  offerType: OfferType,
  activePriceState: ActivePriceState,
  activePriceValue: CoalesecedNumber,
  activePriceCurrency: CurrencyCode,
  active: Schema.Boolean,
  groupUuids: Schema.Array(Schema.String),
  listingType: Schema.optional(ListingType),
  // Accepts both NotificationCypher (legacy encrypted) and VexlNotificationToken (new system)
  // For backwards compatibility, vexlNotificationToken is also stored here
  fcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // New dedicated field for vexl notification token
  vexlNotificationToken: Schema.optional(VexlNotificationToken),
  authorClientVersion: Schema.optional(SemverString),
  goldenAvatarType: Schema.optional(GoldenAvatarType),
})
export type OfferPublicPart = typeof OfferPublicPart.Type

export const spokenLanguagesOptions: SpokenLanguage[] = [
  'ENG',
  'DEU',
  'ESP',
  'FRA',
  'ITA',
  'CZE',
  'SVK',
  'PRT',
  'BG',
]

export const OfferInfo = Schema.Struct({
  id: IdNumeric, // For ordering
  offerId: OfferId,
  privatePart: OfferPrivatePart,
  publicPart: OfferPublicPart,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})
export type OfferInfo = typeof OfferInfo.Type

export const ConnectionLevel = Schema.Literal('FIRST', 'SECOND', 'ALL')
export type ConnectionLevel = typeof ConnectionLevel.Type

export const OfferFlags = Schema.Struct({
  reported: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})
export type OfferFlags = typeof OfferFlags.Type

export const PrivatePayloadEncrypted = Schema.String.pipe(
  Schema.brand('PrivatePayloadEncrypted')
)
export type PrivatePayloadEncrypted = typeof PrivatePayloadEncrypted.Type

export const PublicPayloadEncrypted = Schema.String.pipe(
  Schema.brand('PublicPayloadEncrypted')
)
export type PublicPayloadEncrypted = typeof PublicPayloadEncrypted.Type

export const OwnershipInfo = Schema.Struct({
  adminId: OfferAdminId,
  intendedConnectionLevel: IntendedConnectionLevel,
  intendedClubs: Schema.optionalWith(Schema.Array(ClubUuid), {
    default: () => [],
  }),
})
export type OwnershipInfo = typeof OwnershipInfo.Type

export const OneOfferInState = Schema.Struct({
  offerInfo: OfferInfo,
  flags: OfferFlags,
  ownershipInfo: Schema.optional(OwnershipInfo),
})
export type OneOfferInState = typeof OneOfferInState.Type

export const MyOfferInState = Schema.Struct({
  offerInfo: OfferInfo,
  flags: OfferFlags,
  ownershipInfo: OwnershipInfo,
})
export type MyOfferInState = typeof MyOfferInState.Type

export {CurrencyCode}
