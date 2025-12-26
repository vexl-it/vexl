import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  BtcNetwork,
  FriendLevel,
  ListingType,
  LocationState,
  OfferInfo,
  OfferLocation,
  OfferType,
  OneOfferInState,
  PaymentMethod,
  Sort,
  SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type Effect, Schema} from 'effect'
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
  offerInfo: OfferInfo,
}) {}

export const OffersState = Schema.Struct({
  // changedName to force clients to refetch all offers after update of the offers location shape
  lastUpdatedAt1: Schema.optionalWith(IsoDatetimeString, {
    default: () => MINIMAL_DATE,
  }),
  contactOffersNextPageParam: Schema.optional(Base64String),
  clubOffersNextPageParam: Schema.optionalWith(
    Schema.Record({key: ClubUuid, value: Base64String}),
    {default: () => ({})}
  ),
  offers: Schema.Array(OneOfferInState).pipe(Schema.mutable),
})
export type OffersState = typeof OffersState.Type

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

export const OffersFilter = Schema.Struct({
  sort: Schema.optional(Sort),
  currency: Schema.optional(CurrencyCode),
  location: Schema.optional(Schema.Array(OfferLocation)),
  locationState: Schema.optional(Schema.Array(LocationState)),
  paymentMethod: Schema.optional(Schema.Array(PaymentMethod)),
  btcNetwork: Schema.optional(Schema.Array(BtcNetwork)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
  offerType: Schema.optional(OfferType),
  listingType: Schema.optional(ListingType),
  singlePrice: Schema.optional(Schema.Number),
  singlePriceCurrency: Schema.optional(CurrencyCode),
  amountBottomLimit: Schema.optional(Schema.Number),
  amountTopLimit: Schema.optional(Schema.Number),
  spokenLanguages: Schema.optionalWith(
    Schema.Array(SpokenLanguage).pipe(Schema.mutable),
    {default: () => []}
  ),
  text: Schema.optional(Schema.String),
  clubsUuids: Schema.optional(Schema.Array(ClubUuid)),
})
export type OffersFilter = typeof OffersFilter.Type

export const OffersFilterEquals = (a: OffersFilter, b: OffersFilter): boolean =>
  fastDeepEqualRemoveUndefineds(a, b)

export const BaseOffersFilter = Schema.Literal(
  'BTC_TO_CASH',
  'CASH_TO_BTC',
  'BTC_TO_PRODUCT',
  'PRODUCT_TO_BTC',
  'STH_ELSE',
  'ALL_SELLING_BTC',
  'ALL_BUYING_BTC'
)
export type BaseOffersFilter = typeof BaseOffersFilter.Type

export const FiatOrSats = Schema.Literal('FIAT', 'SATS')
export type FiatOrSats = typeof FiatOrSats.Type
