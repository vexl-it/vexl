import {
  BtcNetwork,
  CurrencyCode,
  FriendLevel,
  ListingType,
  LocationState,
  OfferLocation,
  OfferType,
  OneOfferInState,
  PaymentMethod,
  Sort,
  SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ApiErrorFetchingOffers} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import {z} from 'zod'

export type ApiErrorFetchingRemovedOffers =
  BasicError<'ApiErrorFetchingRemovedOffers'>

export type ApiErrorReportingOffer = BasicError<'ApiErrorReportingOffer'>
export type ApiErrorDeletingOffer = BasicError<'ApiErrorDeletingOffer'>

export const OffersState = z.object({
  // changedName to force clients to refetch all offers after update of the offers location shape
  lastUpdatedAt1: IsoDatetimeString.catch(() => MINIMAL_DATE),
  offers: z.array(OneOfferInState),
})
export type OffersState = z.TypeOf<typeof OffersState>

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

export const OffersFilter = z.object({
  sort: Sort.optional(),
  currency: CurrencyCode.optional(),
  location: OfferLocation.optional().catch(() => undefined),
  locationState: LocationState.optional(),
  paymentMethod: z.array(PaymentMethod).optional(),
  btcNetwork: z.array(BtcNetwork).optional(),
  friendLevel: z.array(FriendLevel).optional(),
  offerType: OfferType.optional(),
  listingType: ListingType.optional(),
  amountBottomLimit: z.coerce.number().optional(),
  amountTopLimit: z.coerce.number().optional(),
  spokenLanguages: z.array(SpokenLanguage).default([]),
  text: z.string().optional(),
})

export type OffersFilter = z.TypeOf<typeof OffersFilter>
