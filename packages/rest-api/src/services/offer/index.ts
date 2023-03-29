import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type CreateAxiosDefaults} from 'axios'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import urlJoin from 'url-join'
import {
  createAxiosInstanceWithAuthAndLogging,
  axiosCallWithValidation,
} from '../../utils'
import {type PlatformName} from '../../PlatformName'
import {
  type CreateNewOfferRequest,
  CreateNewOfferResponse,
  type GetOffersForMeCreatedOrModifiedAfterRequest,
  GetOffersForMeCreatedOrModifiedAfterResponse,
  GetOffersForMeResponse,
} from './contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  url,
  getUserSessionCredentials,
  axiosConfig,
}: {
  platform: PlatformName
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api'),
    }
  )

  return {
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
          headers: request,
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
  }
}

export type OfferPrivateApi = ReturnType<typeof privateApi>
