import {z} from 'zod'
import {UriString} from '../utility/UriString.brand'
import {IdNumeric} from '../utility/IdNumeric'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {IsoDatetimeString} from '../utility/IsoDatetimeString.brand'
import {CurrencyCode} from './currency.brand'
import {JSDateString} from '../utility/JSDateString.brand'

export const Sort = z.enum([
  'LOWEST_FEE_FIRST',
  'HIGHEST_FEE',
  'NEWEST_OFFER',
  'OLDEST_OFFER',
  'LOWEST_AMOUNT',
  'HIGHEST_AMOUNT',
])
export type Sort = z.TypeOf<typeof Sort>

export const OfferId = z.string().min(1).brand<'OfferId'>()
export type OfferId = z.TypeOf<typeof OfferId>

export const OfferAdminId = z.string().brand<'OfferAdminId'>()
export type OfferAdminId = z.TypeOf<typeof OfferAdminId>
export const LocationState = z.enum(['ONLINE', 'IN_PERSON'])
export type LocationState = z.TypeOf<typeof LocationState>

export const PaymentMethod = z.enum(['CASH', 'REVOLUT', 'BANK'])
export type PaymentMethod = z.TypeOf<typeof PaymentMethod>

export const FeeState = z.enum(['WITHOUT_FEE', 'WITH_FEE'])
export type FeeState = z.TypeOf<typeof FeeState>

export const BtcNetwork = z.enum(['LIGHTING', 'ON_CHAIN'])
export type BtcNetwork = z.TypeOf<typeof BtcNetwork>

export const OfferType = z.enum(['BUY', 'SELL'])
export type OfferType = z.TypeOf<typeof OfferType>

export const SpokenLanguage = z.enum([
  'ENG',
  'DEU',
  'CZE',
  'SVK',
  'PRT',
  'FRA',
  'ITA',
  'ESP',
])
export type SpokenLanguage = z.TypeOf<typeof SpokenLanguage>

export {CurrencyCode}

export const FriendLevel = z.enum([
  'FIRST_DEGREE',
  'SECOND_DEGREE',
  'GROUP',
  'NOT_SPECIFIED',
])
export type FriendLevel = z.TypeOf<typeof FriendLevel>

export const ActivePriceState = z.enum([
  'NONE',
  'PRICE_IS_BELOW',
  'PRICE_IS_ABOVE',
])
export type ActivePriceState = z.TypeOf<typeof ActivePriceState>

export const BaseContact = z.object({
  id: IdNumeric,
  name: z.string(),
  photoUri: UriString.optional(),
  markedForUpload: z.boolean(),
})
export type BaseContact = z.TypeOf<typeof BaseContact>

export const CommonFriend = z.object({
  contactHash: z.string(),
  contact: BaseContact.optional(),
})
export type CommonFriend = z.TypeOf<typeof CommonFriend>

export const Location = z.object({
  longitude: z.string(),
  latitude: z.string(),
  city: z.string(),
})

export type Location = z.TypeOf<typeof Location>

export const SymmetricKey = z.string().brand<'SymmetricKey'>()
export type SymmetricKey = z.TypeOf<typeof SymmetricKey>

export const OfferPrivatePart = z.object({
  commonFriends: z.array(z.string()),
  friendLevel: z.array(FriendLevel),
  symmetricKey: SymmetricKey,
})
export type OfferPrivatePart = z.TypeOf<typeof OfferPrivatePart>

export const OfferPublicPart = z.object({
  offerPublicKey: PublicKeyPemBase64,
  location: z.array(Location),
  offerDescription: z.string(),
  amountBottomLimit: z.coerce.number(),
  amountTopLimit: z.coerce.number(),
  feeState: FeeState,
  feeAmount: z.coerce.number(),
  locationState: LocationState,
  paymentMethod: z.array(PaymentMethod),
  btcNetwork: z.array(BtcNetwork),
  currency: CurrencyCode,
  spokenLanguages: z.array(SpokenLanguage).default([]),
  expirationDate: JSDateString.optional(),
  offerType: OfferType,
  activePriceState: ActivePriceState,
  activePriceValue: z.coerce.number(),
  activePriceCurrency: CurrencyCode,
  active: z.boolean(),
  groupUuids: z.array(z.string()),
})
export type OfferPublicPart = z.TypeOf<typeof OfferPublicPart>

export const spokenLanguagesOptions: SpokenLanguage[] = [
  'ENG',
  'DEU',
  'ESP',
  'FRA',
  'ITA',
  'CZE',
  'SVK',
  'PRT',
]

export const OfferInfo = z.object({
  id: IdNumeric, // for ordering
  offerId: OfferId,
  privatePart: OfferPrivatePart,
  publicPart: OfferPublicPart,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})

export type OfferInfo = z.TypeOf<typeof OfferInfo>

export const ConnectionLevel = z.enum(['FIRST', 'SECOND', 'ALL'])
export type ConnectionLevel = z.TypeOf<typeof ConnectionLevel>

export const IntendedConnectionLevel = z.enum(['FIRST', 'ALL'])
export type IntendedConnectionLevel = z.TypeOf<typeof IntendedConnectionLevel>

export const OfferFlags = z.object({
  reported: z.boolean().default(false),
})
export type OfferFlags = z.TypeOf<typeof OfferFlags>

export const PrivatePayloadEncrypted = z
  .string()
  .brand<'PrivatePayloadEncrypted'>()
export type PrivatePayloadEncrypted = z.TypeOf<typeof PrivatePayloadEncrypted>

export const PublicPayloadEncrypted = z
  .string()
  .brand<'PublicPayloadEncrypted'>()
export type PublicPayloadEncrypted = z.TypeOf<typeof PublicPayloadEncrypted>

export const OneOfferInState = z.object({
  offerInfo: OfferInfo,
  flags: OfferFlags,
  ownershipInfo: z
    .object({
      adminId: OfferAdminId,
      intendedConnectionLevel: IntendedConnectionLevel,
    })
    .optional(),
})
export type OneOfferInState = z.TypeOf<typeof OneOfferInState>

export const MyOfferInState = z.object({
  offerInfo: OfferInfo,
  flags: OfferFlags,
  ownershipInfo: z.object({
    adminId: OfferAdminId,
    intendedConnectionLevel: IntendedConnectionLevel,
  }),
})
export type MyOfferInState = z.TypeOf<typeof MyOfferInState>
