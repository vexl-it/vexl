import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Array, Brand, Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import {
  ExpoNotificationToken,
  ExpoNotificationTokenE,
} from '../utility/ExpoNotificationToken.brand'
import {IdNumeric, IdNumericE} from '../utility/IdNumeric'
import {
  IsoDatetimeString,
  IsoDatetimeStringE,
} from '../utility/IsoDatetimeString.brand'
import {JSDateString, JSDateStringE} from '../utility/JSDateString.brand'
import {SemverString, SemverStringE} from '../utility/SmeverString.brand'
import {UriString, UriStringE} from '../utility/UriString.brand'
import {
  Latitude,
  LatitudeE,
  Longitude,
  LongitudeE,
  Radius,
  RadiusE,
} from '../utility/geoCoordinates'
import {HashedPhoneNumber, HashedPhoneNumberE} from './HashedPhoneNumber.brand'
import {ClubUuid, ClubUuidE} from './clubs'
import {CurrencyCode, CurrencyCodeE} from './currency.brand'
import {
  NotificationCypher,
  NotificationCypherE,
} from './notifications/NotificationCypher.brand'

export const Sort = z.enum([
  'LOWEST_FEE_FIRST',
  'HIGHEST_FEE',
  'NEWEST_OFFER',
  'OLDEST_OFFER',
  'LOWEST_AMOUNT',
  'HIGHEST_AMOUNT',
  'MOST_CONNECTIONS',
])
export const SortE = Schema.Literal(
  'LOWEST_FEE_FIRST',
  'HIGHEST_FEE',
  'NEWEST_OFFER',
  'OLDEST_OFFER',
  'LOWEST_AMOUNT',
  'HIGHEST_AMOUNT',
  'MOST_CONNECTIONS'
)
export type Sort = z.TypeOf<typeof Sort>

export const OfferId = z
  .string()
  .min(1)
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'OfferId'>>()(v)
  })
export const OfferIdE = Schema.String.pipe(Schema.brand('OfferId'))
export type OfferId = Schema.Schema.Type<typeof OfferIdE>
export const newOfferId = (): OfferId =>
  Schema.decodeSync(OfferIdE)(randomUUID())

export const OfferAdminId = z
  .string()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'OfferAdminId'>>()(v))
export const OfferAdminIdE = Schema.String.pipe(Schema.brand('OfferAdminId'))
export type OfferAdminId = Schema.Schema.Type<typeof OfferAdminIdE>

export function generateAdminId(): OfferAdminId {
  return Schema.decodeSync(OfferAdminIdE)(randomUUID())
}

export const LocationState = z.enum(['ONLINE', 'IN_PERSON'])
export const LocationStateE = Schema.Literal('ONLINE', 'IN_PERSON')
export type LocationState = Schema.Schema.Type<typeof LocationStateE>

export const PaymentMethod = z.enum(['CASH', 'REVOLUT', 'BANK'])
export const PaymentMethodE = Schema.Literal('CASH', 'REVOLUT', 'BANK')
export type PaymentMethod = Schema.Schema.Type<typeof PaymentMethodE>

export const FeeState = z.enum(['WITHOUT_FEE', 'WITH_FEE'])
export const FeeStateE = Schema.Literal('WITHOUT_FEE', 'WITH_FEE')
export type FeeState = Schema.Schema.Type<typeof FeeStateE>

export const BtcNetwork = z.enum(['LIGHTING', 'ON_CHAIN'])
export const BtcNetworkE = Schema.Literal('LIGHTING', 'ON_CHAIN')
export type BtcNetwork = Schema.Schema.Type<typeof BtcNetworkE>

export const OfferType = z.enum(['BUY', 'SELL'])
export const OfferTypeE = Schema.Literal('BUY', 'SELL')
export type OfferType = Schema.Schema.Type<typeof OfferTypeE>

export const ListingType = z.enum(['BITCOIN', 'PRODUCT', 'OTHER'])
export const ListingTypeE = Schema.Literal('BITCOIN', 'PRODUCT', 'OTHER')
export type ListingType = Schema.Schema.Type<typeof ListingTypeE>

export const DeliveryMethod = z.enum(['PICKUP', 'DELIVERY'])
export const DeliveryMethodE = Schema.Literal('PICKUP', 'DELIVERY')
export type DeliveryMethod = Schema.Schema.Type<typeof DeliveryMethodE>

export const SpokenLanguage = z
  .enum(['ENG', 'DEU', 'CZE', 'SVK', 'PRT', 'FRA', 'ITA', 'ESP', 'BG'])
  .default('ENG')
export const SpokenLanguageE = Schema.Literal(
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
export type SpokenLanguage = Schema.Schema.Type<typeof SpokenLanguageE>

export const FriendLevel = z.enum([
  'FIRST_DEGREE',
  'SECOND_DEGREE',
  'CLUB',
  'NOT_SPECIFIED',
])
export const FriendLevelE = Schema.Literal(
  'FIRST_DEGREE',
  'SECOND_DEGREE',
  'CLUB',
  'NOT_SPECIFIED'
)
export type FriendLevel = Schema.Schema.Type<typeof FriendLevelE>

export const ActivePriceState = z.enum([
  'NONE',
  'PRICE_IS_BELOW',
  'PRICE_IS_ABOVE',
])
export const ActivePriceStateE = Schema.Literal(
  'NONE',
  'PRICE_IS_BELOW',
  'PRICE_IS_ABOVE'
)
export type ActivePriceState = Schema.Schema.Type<typeof ActivePriceStateE>

export const BaseContactId = z
  .number()
  .int()
  .min(0)
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'BaseContactId'>>()(v)
  })
export const BaseContactIdE = Schema.Int.pipe(
  Schema.greaterThanOrEqualTo(0),
  Schema.brand('BaseContactId')
)
export type BaseContactId = Schema.Schema.Type<typeof BaseContactIdE>

export const BaseContact = z.object({
  id: BaseContactId.readonly(),
  name: z.string().readonly(),
  photoUri: UriString.optional().readonly(),
  markedForUpload: z.boolean().readonly(),
})
export const BaseContactE = Schema.Struct({
  id: BaseContactIdE,
  name: Schema.String,
  photoUri: Schema.optional(UriStringE),
  markedForUpload: Schema.Boolean,
})
export type BaseContact = Schema.Schema.Type<typeof BaseContactE>

export const CommonFriend = z.object({
  contactHash: HashedPhoneNumber.readonly(),
  contact: BaseContact.optional().readonly(),
})
export const CommonFriendE = Schema.Struct({
  contactHash: HashedPhoneNumberE,
  contact: Schema.optional(BaseContactE),
})
export type CommonFriend = Schema.Schema.Type<typeof CommonFriendE>

export const LocationPlaceId = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'LocationPlaceId'>>()(v)
  )
export const LocationPlaceIdE = Schema.String.pipe(
  Schema.brand('LocationPlaceId')
)

export type LocationPlaceId = Schema.Schema.Type<typeof LocationPlaceIdE>

export const OfferLocation = z
  .object({
    placeId: LocationPlaceId,
    latitude: Latitude,
    longitude: Longitude,
    radius: Radius,
    address: z.string(),
    shortAddress: z.string(),
  })
  .readonly()
export const OfferLocationE = Schema.Struct({
  placeId: LocationPlaceIdE,
  latitude: LatitudeE,
  longitude: LongitudeE,
  radius: RadiusE,
  address: Schema.String,
  shortAddress: Schema.String,
})
export type OfferLocation = Schema.Schema.Type<typeof OfferLocationE>

export const LocationStateToArray = z
  .unknown()
  .transform((previous) => {
    const deprecatedLocationStateFormat = LocationState.safeParse(previous)
    if (deprecatedLocationStateFormat.success) {
      return [deprecatedLocationStateFormat.data]
    }
    return previous
  })
  .pipe(z.array(LocationState))

export const LocationStateToArrayE = Schema.transform(
  Schema.Union(LocationStateE, Schema.Array(LocationStateE)),
  Schema.Array(LocationStateE),
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

export const SymmetricKey = z
  .string()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'SymmetricKey'>>()(v))
export const SymmetricKeyE = Schema.String.pipe(Schema.brand('SymmetricKey'))
export type SymmetricKey = Schema.Schema.Type<typeof SymmetricKeyE>

export const IntendedConnectionLevel = z.enum(['FIRST', 'ALL'])
export const IntendedConnectionLevelE = Schema.Literal('FIRST', 'ALL')
export type IntendedConnectionLevel = typeof IntendedConnectionLevelE.Type

export const GoldenAvatarType = z
  .enum(['BACKGROUND_AND_GLASSES'])
  .catch('BACKGROUND_AND_GLASSES')
export const GoldenAvatarTypeE = Schema.Literal('BACKGROUND_AND_GLASSES').pipe(
  orElseSchema('BACKGROUND_AND_GLASSES' as const)
)
export type GoldenAvatarType = typeof GoldenAvatarTypeE.Type

export const OfferPrivatePart = z
  .object({
    commonFriends: z.array(HashedPhoneNumber).readonly(),
    friendLevel: z.array(FriendLevel).readonly(),
    symmetricKey: SymmetricKey,
    clubIds: z.array(ClubUuid).optional().default([]).readonly(),
    // For admin only
    adminId: OfferAdminId.optional(),
    intendedConnectionLevel: IntendedConnectionLevel.optional(),
    intendedClubs: z.array(ClubUuid).optional().readonly(),
  })
  .readonly()
export const OfferPrivatePartE = Schema.Struct({
  commonFriends: Schema.Array(HashedPhoneNumberE),
  friendLevel: Schema.Array(FriendLevelE),
  symmetricKey: SymmetricKeyE,
  clubIds: Schema.optionalWith(Schema.Array(ClubUuidE), {
    default: () => [],
  }),
  // For admin only
  adminId: Schema.optional(OfferAdminIdE),
  intendedConnectionLevel: Schema.optional(IntendedConnectionLevelE),
  intendedClubs: Schema.optional(Schema.Array(ClubUuidE)),
})
export type OfferPrivatePart = Schema.Schema.Type<typeof OfferPrivatePartE>

export const OfferPublicPart = z
  .object({
    offerPublicKey: PublicKeyPemBase64,
    location: z.array(OfferLocation).catch([]).readonly(),
    offerDescription: z.string(),
    amountBottomLimit: z.coerce.number(),
    amountTopLimit: z.coerce.number(),
    feeState: FeeState,
    feeAmount: z.coerce.number(),
    locationState: LocationStateToArray.catch([]).readonly(),
    paymentMethod: z.array(PaymentMethod).readonly(),
    btcNetwork: z.array(BtcNetwork).readonly(),
    currency: CurrencyCode,
    spokenLanguages: z.array(SpokenLanguage),
    expirationDate: JSDateString.optional(),
    offerType: OfferType,
    activePriceState: ActivePriceState,
    activePriceValue: z.coerce.number(),
    activePriceCurrency: CurrencyCode,
    active: z.boolean(),
    groupUuids: z.array(z.string()).readonly(),
    listingType: ListingType.optional(),
    fcmCypher: NotificationCypher.optional(),
    authorClientVersion: SemverString.optional(),
    goldenAvatarType: GoldenAvatarType.optional(),
  })
  .readonly()

const CoalesecedNumber = Schema.Union(Schema.Number, Schema.NumberFromString)

export const OfferPublicPartE = Schema.Struct({
  offerPublicKey: PublicKeyPemBase64E,
  location: Schema.Array(OfferLocationE),
  offerDescription: Schema.String,
  amountBottomLimit: CoalesecedNumber,
  amountTopLimit: CoalesecedNumber,
  feeState: FeeStateE,
  feeAmount: CoalesecedNumber,
  locationState: LocationStateToArrayE,
  paymentMethod: Schema.Array(PaymentMethodE),
  btcNetwork: Schema.Array(BtcNetworkE),
  currency: CurrencyCodeE,
  spokenLanguages: Schema.Array(SpokenLanguageE)
    // Otherwise split atom does not work...
    .pipe(Schema.mutable),
  expirationDate: Schema.optional(JSDateStringE),
  offerType: OfferTypeE,
  activePriceState: ActivePriceStateE,
  activePriceValue: CoalesecedNumber,
  activePriceCurrency: CurrencyCodeE,
  active: Schema.Boolean,
  groupUuids: Schema.Array(Schema.String),
  listingType: Schema.optional(ListingTypeE),
  fcmCypher: Schema.optional(NotificationCypherE),
  authorClientVersion: Schema.optional(SemverStringE),
  goldenAvatarType: Schema.optional(GoldenAvatarTypeE),
})
export type OfferPublicPart = Schema.Schema.Type<typeof OfferPublicPartE>

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

export const OfferInfo = z
  .object({
    id: IdNumeric, // for ordering
    offerId: OfferId,
    privatePart: OfferPrivatePart,
    publicPart: OfferPublicPart,
    createdAt: IsoDatetimeString,
    modifiedAt: IsoDatetimeString,
  })
  .readonly()
export type OfferInfo = Schema.Schema.Type<typeof OfferInfoE>

export const OfferInfoE = Schema.Struct({
  id: IdNumericE, // For ordering
  offerId: OfferIdE,
  privatePart: OfferPrivatePartE,
  publicPart: OfferPublicPartE,
  createdAt: IsoDatetimeStringE,
  modifiedAt: IsoDatetimeStringE,
})
export type OfferInfoE = Schema.Schema.Type<typeof OfferInfoE>

export const ConnectionLevel = z.enum(['FIRST', 'SECOND', 'ALL'])
export const ConnectionLevelE = Schema.Literal('FIRST', 'SECOND', 'ALL')
export type ConnectionLevel = Schema.Schema.Type<typeof ConnectionLevelE>

export const OfferFlags = z
  .object({
    reported: z.boolean().default(false),
  })
  .readonly()
export const OfferFlagsE = Schema.Struct({
  reported: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})
export type OfferFlags = Schema.Schema.Type<typeof OfferFlagsE>

export const PrivatePayloadEncrypted = z.string().transform((v) => {
  return Brand.nominal<typeof v & Brand.Brand<'PrivatePayloadEncrypted'>>()(v)
})
export const PrivatePayloadEncryptedE = Schema.String.pipe(
  Schema.brand('PrivatePayloadEncrypted')
)
export type PrivatePayloadEncrypted = typeof PrivatePayloadEncryptedE.Type

export const PublicPayloadEncrypted = z.string().transform((v) => {
  return Brand.nominal<typeof v & Brand.Brand<'PublicPayloadEncrypted'>>()(v)
})
export const PublicPayloadEncryptedE = Schema.String.pipe(
  Schema.brand('PublicPayloadEncrypted')
)
export type PublicPayloadEncrypted = typeof PublicPayloadEncryptedE.Type

export const OwnershipInfo = z
  .object({
    adminId: OfferAdminId,
    intendedConnectionLevel: IntendedConnectionLevel,
    intendedClubs: z.array(ClubUuid).optional().readonly(),
  })
  .readonly()
export const OwnershipInfoE = Schema.Struct({
  adminId: OfferAdminIdE,
  intendedConnectionLevel: IntendedConnectionLevelE,
  intendedClubs: Schema.optional(Schema.Array(ClubUuidE)),
})
export type OwnershipInfo = Schema.Schema.Type<typeof OwnershipInfoE>

export const OneOfferInState = z
  .object({
    offerInfo: OfferInfo,
    flags: OfferFlags,
    lastCommitedFcmToken: ExpoNotificationToken.optional(),
    ownershipInfo: OwnershipInfo.optional(),
  })
  .readonly()
export const OneOfferInStateE = Schema.Struct({
  offerInfo: OfferInfoE,
  flags: OfferFlagsE,
  lastCommitedFcmToken: Schema.optional(ExpoNotificationTokenE),
  ownershipInfo: Schema.optional(OwnershipInfoE),
})
export type OneOfferInState = Schema.Schema.Type<typeof OneOfferInStateE>

export const MyOfferInState = z
  .object({
    offerInfo: OfferInfo,
    flags: OfferFlags,
    lastCommitedFcmToken: ExpoNotificationToken.optional(),
    ownershipInfo: OwnershipInfo,
  })
  .readonly()
export const MyOfferInStateE = Schema.Struct({
  offerInfo: OfferInfoE,
  flags: OfferFlagsE,
  lastCommitedFcmToken: Schema.optional(ExpoNotificationTokenE),
  ownershipInfo: OwnershipInfoE,
})
export type MyOfferInState = Schema.Schema.Type<typeof MyOfferInStateE>

export {CurrencyCode}
