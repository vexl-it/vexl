import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {CurrencyCodeE} from '@vexl-next/domain/src/general/currency.brand'
import {
  BtcNetworkE,
  FriendLevelE,
  ListingTypeE,
  LocationStateE,
  OfferInfoE,
  OfferLocationE,
  OfferTypeE,
  OneOfferInState,
  OneOfferInStateE,
  PaymentMethodE,
  SortE,
  SpokenLanguageE,
} from '@vexl-next/domain/src/general/offers'
import {Base64StringE} from '@vexl-next/domain/src/utility/Base64String.brand'
import {
  IsoDatetimeStringE,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type Effect, Schema} from 'effect'
import {z} from 'zod'
import {fastDeepEqualRemoveUndefineds} from '../../utils/fastDeepEqualRemoveUndefineds'

export type ApiErrorFetchingOffers = Effect.Effect.Error<
  ReturnType<OfferApi['getOffersForMeModifiedOrCreatedAfter']>
>

export type ApiErrorFetchingRemovedOffers =
  BasicError<'ApiErrorFetchingRemovedOffers'>

export type ApiErrorReportingOffer = BasicError<'ApiErrorReportingOffer'>
export type ApiErrorDeletingOffer = BasicError<'ApiErrorDeletingOffer'>

export class NotOfferFromContactNetworkError extends Schema.TaggedError<NotOfferFromContactNetworkError>(
  'NotOfferFromContactNetworkError'
)('NotOfferFromContactNetworkError', {
  offerInfo: OfferInfoE,
}) {}

export const OffersState = z
  .object({
    // changedName to force clients to refetch all offers after update of the offers location shape
    contactOffersNextPageParam: z.string().optional(),
    clubOffersNextPageParam: z.string().optional(),
    offers: z.array(OneOfferInState),
  })
  .readonly()
export const OffersStateE = Schema.Struct({
  // changedName to force clients to refetch all offers after update of the offers location shape
  lastUpdatedAt1: IsoDatetimeStringE.pipe(
    Schema.optionalWith({default: () => MINIMAL_DATE})
  ),
  lastPrivatePartContactOfferIdBase64: Schema.optional(Base64StringE),
  lastPrivatePartClubOfferIdBase64: Schema.optional(Base64StringE),
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
  error: Effect.Effect.Error<
    | ReturnType<OfferApi['getOffersForMeModifiedOrCreatedAfterPaginated']>
    | ReturnType<OfferApi['getClubOffersForMeModifiedOrCreatedAfterPaginated']>
  >
}

export interface InProgressLoadingState {
  state: 'inProgress'
}

export type LoadingState =
  | InitialLoadingState
  | SuccessLoadingState
  | ErrorLoadingState
  | InProgressLoadingState

export const OffersFilterE = Schema.Struct({
  sort: Schema.optional(SortE),
  currency: Schema.optional(CurrencyCodeE),
  location: Schema.optional(Schema.Array(OfferLocationE)),
  locationState: Schema.optional(Schema.Array(LocationStateE)),
  paymentMethod: Schema.optional(Schema.Array(PaymentMethodE)),
  btcNetwork: Schema.optional(Schema.Array(BtcNetworkE)),
  friendLevel: Schema.optional(Schema.Array(FriendLevelE)),
  offerType: Schema.optional(OfferTypeE),
  listingType: Schema.optional(ListingTypeE),
  singlePrice: Schema.optional(Schema.Number),
  singlePriceCurrency: Schema.optional(CurrencyCodeE),
  amountBottomLimit: Schema.optional(Schema.Number),
  amountTopLimit: Schema.optional(Schema.Number),
  spokenLanguages: Schema.optionalWith(
    Schema.Array(SpokenLanguageE).pipe(Schema.mutable),
    {default: () => []}
  ),
  text: Schema.optional(Schema.String),
  clubsUuids: Schema.optional(Schema.Array(ClubUuidE)),
})

export type OffersFilter = typeof OffersFilterE.Type
export const offersFilterEquals = (a: OffersFilter, b: OffersFilter): boolean =>
  fastDeepEqualRemoveUndefineds(a, b)

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
