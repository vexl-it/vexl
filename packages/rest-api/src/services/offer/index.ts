import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type CreateAxiosDefaults} from 'axios'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import urlJoin from 'url-join'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {type PlatformName} from '../../PlatformName'
import {
  type CreateNewOfferRequest,
  CreateNewOfferResponse,
  type CreatePrivatePartRequest,
  CreatePrivatePartResponse,
  type DeleteOfferRequest,
  DeleteOfferResponse,
  type DeletePrivatePartRequest,
  DeletePrivatePartResponse,
  GetOfferByIdsResponse,
  type GetOffersByIdsRequest,
  type GetOffersForMeCreatedOrModifiedAfterRequest,
  GetOffersForMeCreatedOrModifiedAfterResponse,
  GetOffersForMeResponse,
  type RefreshOfferRequest,
  RefreshOfferResponse,
  type RemovedOfferIdsRequest,
  RemovedOfferIdsResponse,
  type ReportOfferRequest,
  ReportOfferResponse,
  type UpdateOfferRequest,
  UpdateOfferResponse,
} from './contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api'),
    },
    loggingFunction
  )

  return {
    getOffersByIds: (request: GetOffersByIdsRequest) =>
      axiosCallWithValidation(
        axiosInstance,
        {
          method: 'get',
          url: '/v2/offers',
          params: {offerIds: request.ids.join(',')},
        },
        GetOfferByIdsResponse
      ),
    getOffersForMe: () => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'get',
          url: '/v2/offers/me',
        },
        GetOffersForMeResponse
      )
    },
    getOffersForMeModifiedOrCreatedAfter: (
      request: GetOffersForMeCreatedOrModifiedAfterRequest
    ) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'get',
          url: '/v2/offers/me/modified',
          params: request,
        },
        GetOffersForMeCreatedOrModifiedAfterResponse
      )
    },
    createNewOffer: (request: CreateNewOfferRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          url: '/v2/offers',
          data: request,
        },
        CreateNewOfferResponse
      )
    },
    refreshOffer: (request: RefreshOfferRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          url: '/v2/offers/refresh',
          data: request,
        },
        RefreshOfferResponse
      )
    },
    deleteOffer: (request: DeleteOfferRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'delete',
          url: '/v1/offers',
          params: {adminIds: request.adminIds.join(',')},
        },
        DeleteOfferResponse
      )
    },
    updateOffer: (request: UpdateOfferRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'put',
          url: '/v2/offers',
          data: request,
        },
        UpdateOfferResponse
      )
    },
    createPrivatePart: (request: CreatePrivatePartRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          url: '/v2/offers/private-part',
          data: request,
        },
        CreatePrivatePartResponse
      )
    },
    deletePrivatePart: (request: DeletePrivatePartRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'delete',
          url: '/v1/offers/private-part',
          data: request,
        },
        DeletePrivatePartResponse
      )
    },
    getRemovedOffers: (request: RemovedOfferIdsRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          url: '/v1/offers/not-exist',
          data: request,
        },
        RemovedOfferIdsResponse
      )
    },
    reportOffer: (request: ReportOfferRequest) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          url: '/v1/offers/report',
          data: request,
        },
        ReportOfferResponse
      )
    },
  }
}

export type OfferPrivateApi = ReturnType<typeof privateApi>
