import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  BtcNetwork,
  FriendLevel,
  LocationState,
  OfferInfo,
  OfferLocation,
  OneOfferInState,
  PaymentMethod,
  ProductCategory,
  Sort,
  SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {withNullishDefault} from '@vexl-next/generic-utils/src/effect-helpers/optionalNullable'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect, Schema} from 'effect'
import {fastDeepEqualRemoveUndefineds} from '../../utils/fastDeepEqualRemoveUndefineds'

export const REACH_NUMBER_THRESHOLD = 150

export type ApiErrorFetchingOffers = Effect.Error<
  ReturnType<OfferApi['getOffersForMeModifiedOrCreatedAfterPaginated']>
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
  lastUpdatedAt2: IsoDatetimeString.pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => MINIMAL_DATE)),
    Schema.withConstructorDefault(Effect.sync(() => MINIMAL_DATE))
  ),
  contactOffersNextPageParam: Schema.optional(Base64String),
  clubOffersNextPageParam: Schema.Record(ClubUuid, Base64String).pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => ({}))),
    Schema.withConstructorDefault(Effect.sync(() => ({})))
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
  error: Effect.Error<
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

export const MarketplaceFilterBarOption = Schema.Literals([
  'BUY_BTC',
  'SELL_BTC',
  'BUY_PRODUCT',
  'SELL_PRODUCT',
  'PROVIDE_SERVICE',
  'HIRE_SERVICE',
])
export type MarketplaceFilterBarOption = typeof MarketplaceFilterBarOption.Type

export const MarketplaceVisibleSection = Schema.Literals([
  'ALL',
  'ONLY_FAVOURITES',
  'ONLY_ARCHIVED',
])
export type MarketplaceVisibleSection = typeof MarketplaceVisibleSection.Type

export const OffersFilter = Schema.Struct({
  sort: Schema.optional(Sort),
  visibleSection: MarketplaceVisibleSection.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 'ALL' => 'ALL')),
    Schema.withConstructorDefault(Effect.sync((): 'ALL' => 'ALL'))
  ),
  currency: Schema.optional(CurrencyCode),
  location: Schema.optional(Schema.Array(OfferLocation)),
  locationState: Schema.optional(Schema.Array(LocationState)),
  paymentMethod: Schema.optional(Schema.Array(PaymentMethod)),
  btcNetwork: Schema.optional(Schema.Array(BtcNetwork)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
  filterBarOptions: withNullishDefault(
    Schema.toCodecJson(Schema.ReadonlySet(MarketplaceFilterBarOption)),
    () => new Set()
  ),
  singlePrice: Schema.optional(Schema.Number),
  singlePriceCurrency: Schema.optional(CurrencyCode),
  amountBottomLimit: Schema.optional(Schema.Number),
  amountTopLimit: Schema.optional(Schema.Number),
  spokenLanguages: Schema.Array(SpokenLanguage)
    .pipe(Schema.mutable)
    .pipe(
      Schema.withDecodingDefaultType(Effect.sync(() => [])),
      Schema.withConstructorDefault(Effect.sync(() => []))
    ),
  text: Schema.optional(Schema.String),
  clubsUuids: Schema.optional(Schema.Array(ClubUuid)),
  productCategories: Schema.optional(Schema.Array(ProductCategory)),
})
export type OffersFilter = typeof OffersFilter.Type

export const OffersFilterEquals = (a: OffersFilter, b: OffersFilter): boolean =>
  fastDeepEqualRemoveUndefineds(a, b)

export const FiatOrSats = Schema.Literals(['FIAT', 'SATS'])
export type FiatOrSats = typeof FiatOrSats.Type
