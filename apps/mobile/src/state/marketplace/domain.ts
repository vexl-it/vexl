import {
  BtcNetwork,
  CurrencyCode,
  FriendLevel,
  ListingType,
  LocationState,
  OfferLocation,
  OfferType,
  OneOfferInState,
  OneOfferInStateE,
  PaymentMethod,
  Sort,
  SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {
  IsoDatetimeString,
  IsoDatetimeStringE,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ApiErrorFetchingOffers} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import {Schema} from 'effect'
import {z} from 'zod'

export type ApiErrorFetchingRemovedOffers =
  BasicError<'ApiErrorFetchingRemovedOffers'>

export type ApiErrorReportingOffer = BasicError<'ApiErrorReportingOffer'>
export type ApiErrorDeletingOffer = BasicError<'ApiErrorDeletingOffer'>

export const OffersState = z
  .object({
    // changedName to force clients to refetch all offers after update of the offers location shape
    lastUpdatedAt1: IsoDatetimeString.catch(() => MINIMAL_DATE),
    offers: z.array(OneOfferInState),
  })
  .readonly()
export const OffersStateE = Schema.Struct({
  // changedName to force clients to refetch all offers after update of the offers location shape
  lastUpdatedAt1: IsoDatetimeStringE.pipe(
    Schema.optionalWith({default: () => MINIMAL_DATE})
  ),
  offers: Schema.Array(OneOfferInStateE),
})
export type OffersState = typeof OffersStateE.Type

export interface InitialLoadingState {
  state: 'initial'
}

export interface SuccessLoadingState {
  state: 'success'
}

export interface ErrorLoadingState {
  state: 'error'
  error: ApiErrorFetchingOffers
}

export interface InProgressLoadingState {
  state: 'inProgress'
}

export type LoadingState =
  | InitialLoadingState
  | SuccessLoadingState
  | ErrorLoadingState
  | InProgressLoadingState

export const OffersFilter = z
  .object({
    sort: Sort.optional(),
    currency: CurrencyCode.optional(),
    location: OfferLocation.optional().catch(() => undefined),
    locationState: z.array(LocationState).optional().readonly(),
    paymentMethod: z.array(PaymentMethod).optional().readonly(),
    btcNetwork: z.array(BtcNetwork).optional().readonly(),
    friendLevel: z.array(FriendLevel).optional().readonly(),
    offerType: OfferType.optional(),
    listingType: ListingType.optional(),
    singlePrice: z.coerce.number().optional(),
    singlePriceCurrency: CurrencyCode.optional(),
    amountBottomLimit: z.coerce.number().optional(),
    amountTopLimit: z.coerce.number().optional(),
    spokenLanguages: z.array(SpokenLanguage).default([]),
    text: z.string().optional(),
  })
  .readonly()

export type OffersFilter = z.TypeOf<typeof OffersFilter>

export const BaseOffersFilter = z.enum([
  'BTC_TO_CASH',
  'CASH_TO_BTC',
  'BTC_TO_PRODUCT',
  'PRODUCT_TO_BTC',
  'STH_ELSE',
  'ALL_SELLING_BTC',
  'ALL_BUYING_BTC',
])

export type BaseOffersFilter = z.TypeOf<typeof BaseOffersFilter>

export const FiatOrSats = z.enum(['FIAT', 'SATS'])
export const FiatOrSatsE = Schema.Literal('FIAT', 'SATS')
export type FiatOrSats = typeof FiatOrSatsE.Type
