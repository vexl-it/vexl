import {z} from 'zod'
import {UriString} from '../utility/UriString.brand'
import {UserNameAndAvatar} from './UserNameAndAvatar.brand'
import {IdNumeric} from '../utility/IdNumeric'
import {Uuid} from '../utility/Uuid.brand'
import {KeyHolder} from '@vexl-next/cryptography'

export const OfferId = z.string().min(1).brand<'OfferId'>()
export type OfferId = z.TypeOf<typeof OfferId>

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
export const FriendLevel = z.enum(['FIRST_DEGREE', 'SECOND_DEGREE', 'GROUP'])
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
export const Currency = z.string().min(3).max(3)
export type Currency = z.TypeOf<typeof Currency>

export const Location = z.object({
  longitude: z.string(),
  latitude: z.string(),
  city: z.string(),
})

export type Location = z.TypeOf<typeof Location>

export const OfferInfo = z.object({
  id: IdNumeric,
  offerId: OfferId,
  offerPublicKey: KeyHolder.PublicKeyPemBase64,
  offerDescription: z.string(),
  amountBottomLimit: z.number(),
  amountTopLimit: z.number(),
  feeState: FeeState,
  feeAmount: z.number(),
  locationState: LocationState,
  location: Location,
  paymentMethod: z.array(PaymentMethod),
  btcNetwork: z.array(BtcNetwork),
  currency: z.string(),
  friendLevel: z.array(FriendLevel),
  offerType: OfferType,
  activePriceState: ActivePriceState,
  activePriceValue: z.number(),
  activePriceCurrency: z.string().min(3).max(3),
  active: z.boolean(),
  commonFriends: z.array(CommonFriend),
  groupUuids: z.array(Uuid),
  createdAt: z.string().datetime({offset: true}),
  modifiedAt: z.string().datetime({offset: true}),
})

export type OfferInfo = z.TypeOf<typeof OfferInfo>

export const OfferFlags = z.object({
  isMine: z.boolean(),
  isRequested: z.boolean(),
  realUserData: UserNameAndAvatar.optional(),
})
export type OfferFlags = z.TypeOf<typeof OfferFlags>
