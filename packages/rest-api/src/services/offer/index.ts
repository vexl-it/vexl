import {type CreateAxiosDefaults} from 'axios'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {
  CreateNewOfferResponse,
  CreatePrivatePartResponse,
  DeleteOfferResponse,
  DeletePrivatePartResponse,
  GetOfferByIdsResponse,
  GetOffersForMeCreatedOrModifiedAfterResponse,
  GetOffersForMeResponse,
  RefreshOfferResponse,
  RemovedOfferIdsResponse,
  ReportOfferResponse,
  UpdateOfferResponse,
  type CreateNewOfferRequest,
  type CreatePrivatePartRequest,
  type DeleteOfferRequest,
  type DeletePrivatePartRequest,
  type GetOffersByIdsRequest,
  type GetOffersForMeCreatedOrModifiedAfterRequest,
  type RefreshOfferRequest,
  type RemovedOfferIdsRequest,
  type ReportOfferLimitReachedError,
  type ReportOfferRequest,
  type UpdateOfferRequest,
} from './contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: number
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
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
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/v1/offers/report',
            data: request,
          },
          ReportOfferResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100108') {
              return {
                _tag: 'ReportOfferLimitReachedError',
              } as ReportOfferLimitReachedError
            }
          }
          return e
        })
      )
    },
  }
}

export type OfferPrivateApi = ReturnType<typeof privateApi>
