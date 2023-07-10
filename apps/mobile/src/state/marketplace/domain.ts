import {z} from 'zod'
import {
  BtcNetwork,
  CurrencyCode,
  FriendLevel,
  IntendedConnectionLevel,
  Location,
  LocationState,
  OfferFlags,
  OfferInfo,
  OfferType,
  PaymentMethod,
  Sort,
} from '@vexl-next/domain/dist/general/offers'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type ApiErrorFetchingOffers} from '@vexl-next/resources-utils/dist/offers/getNewOffersAndDecrypt'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'

export type ApiErrorFetchingRemovedOffers =
  BasicError<'ApiErrorFetchingRemovedOffers'>

export type ApiErrorReportingOffer = BasicError<'ApiErrorReportingOffer'>
export type ApiErrorDeletingOffer = BasicError<'ApiErrorDeletingOffer'>
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

export const OffersState = z.object({
  lastUpdatedAt: IsoDatetimeString,
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
  location: z.array(Location).optional(),
  locationState: LocationState.optional(),
  paymentMethod: z.array(PaymentMethod).optional(),
  btcNetwork: z.array(BtcNetwork).optional(),
  friendLevel: z.array(FriendLevel).optional(),
  offerType: OfferType.optional(),
  amountBottomLimit: z.coerce.number().optional(),
  amountTopLimit: z.coerce.number().optional(),
})

export type OffersFilter = z.TypeOf<typeof OffersFilter>
