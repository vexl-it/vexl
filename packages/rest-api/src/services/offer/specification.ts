import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ChallengeApiGroup} from '@vexl-next/server-utils/src/services/challenge/specification'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  CanNotDeletePrivatePartOfAuthor,
  CreateNewOfferErrors,
  CreateNewOfferRequest,
  CreateNewOfferResponse,
  CreatePrivatePartRequest,
  CreatePrivatePartResponse,
  DeleteOfferRequest,
  DeleteOfferResponse,
  DeletePrivatePartRequest,
  DeletePrivatePartResponse,
  DuplicatedPublicKeyError,
  GetClubOffersByIdsRequest,
  GetClubOffersForMeCreatedOrModifiedAfterRequest,
  GetClubOffersForMeRequest,
  GetOfferByIdsResponse,
  GetOffersByIdsRequest,
  GetOffersForMeCreatedOrModifiedAfterRequest,
  GetOffersForMeCreatedOrModifiedAfterResponse,
  GetOffersForMeResponse,
  RefreshOfferRequest,
  RefreshOfferResponse,
  RemovedClubOfferIdsRequest,
  RemovedOfferIdsRequest,
  RemovedOfferIdsResponse,
  ReportOfferEndpointErrors,
  ReportOfferRequest,
  ReportOfferResponse,
  UpdateOfferErrors,
  UpdateOfferRequest,
  UpdateOfferResponse,
} from './contracts'

export const GetOffersByIdsEndpint = Api.get(
  'getOffersByIds',
  '/api/v2/offers',
  {summary: 'Get offers by ids'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(GetOffersByIdsRequest),
  Api.setResponseBody(GetOfferByIdsResponse)
)

export const GetClubOffersByIdsEndpint = Api.post(
  'getClubOffersByIds',
  '/api/v2/clubOffers',
  {summary: 'Get club offers by ids'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(GetClubOffersByIdsRequest),
  Api.setResponseBody(GetOfferByIdsResponse)
)

export const GetOffersForMeEndpoint = Api.get(
  'getOffersForMe',
  '/api/v2/offers/me',
  {summary: 'Get offers for me'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseBody(GetOffersForMeResponse)
)

export const GetClubOffersForMeEndpoint = Api.post(
  'getClubOffersForMe',
  '/api/v2/clubOffers/me',
  {summary: 'Get club offers for me'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(GetClubOffersForMeRequest),
  Api.setResponseBody(GetOffersForMeResponse)
)

export const GetOffersForMeModifiedOrCreatedAfterEndpoint = Api.get(
  'getOffersForMeModifiedOrCreatedAfter',
  '/api/v2/offers/me/modified',
  {summary: 'Get offers for me modified or created after'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(GetOffersForMeCreatedOrModifiedAfterRequest),
  Api.setResponseBody(GetOffersForMeCreatedOrModifiedAfterResponse)
)

export const GetClubOffersForMeModifiedOrCreatedAfterEndpoint = Api.post(
  'getClubOffersForMeModifiedOrCreatedAfter',
  '/api/v2/clubOffers/me/modified',
  {summary: 'Get club offers for me modified or created after'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(GetClubOffersForMeCreatedOrModifiedAfterRequest),
  Api.setResponseBody(GetOffersForMeCreatedOrModifiedAfterResponse)
)

export const CreateNewOfferEndpoint = Api.post(
  'createNewOffer',
  '/api/v2/offers',
  {summary: 'Create offer'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(CreateNewOfferRequest),
  Api.setResponseBody(CreateNewOfferResponse),
  Api.addResponse({
    status: 400 as const,
    body: CreateNewOfferErrors,
  })
)

export const RefreshOfferEndpoint = Api.post(
  'refreshOffer',
  '/api/v2/offers/refresh',
  {summary: 'Refresh offer'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(RefreshOfferRequest),
  Api.setResponseBody(RefreshOfferResponse),
  Api.addResponse({
    status: 404 as const,
    body: NotFoundError,
  })
)

export const DeleteOfferEndpoint = Api.delete('deleteOffer', '/api/v1/offers', {
  summary: 'Delete offer',
}).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(DeleteOfferRequest),
  Api.setResponseBody(DeleteOfferResponse)
)

export const UpdateOfferEndpoint = Api.put('updateOffer', '/api/v2/offers', {
  summary: 'Update offer',
}).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(UpdateOfferRequest),
  Api.setResponseBody(UpdateOfferResponse),
  Api.addResponse({
    status: 400 as const,
    body: UpdateOfferErrors,
  }),
  Api.addResponse({
    status: 404 as const,
    body: NotFoundError,
  })
)

export const CreatePrivatePartEndpoint = Api.post(
  'createPrivatePart',
  '/api/v2/offers/private-part',
  {summary: 'Create private part'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(CreatePrivatePartRequest),
  Api.setResponseBody(CreatePrivatePartResponse),
  Api.addResponse({
    status: 400 as const,
    body: DuplicatedPublicKeyError,
  })
)

export const DeletePrivatePartEndpoint = Api.delete(
  'deletePrivatePart',
  '/api/v1/offers/private-part',
  {
    summary: 'Delete private part',
    description:
      'When offer for one of adminIds is not found, no error is returned',
  }
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(DeletePrivatePartRequest),
  Api.setResponseBody(DeletePrivatePartResponse),
  Api.addResponse({
    status: 400 as const,
    body: CanNotDeletePrivatePartOfAuthor,
  })
)

export const GetRemovedOffersEndpoint = Api.post(
  'getRemovedOffers',
  '/api/v1/offers/not-exist',
  {summary: 'Get removed offers'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(RemovedOfferIdsRequest),
  Api.setResponseBody(RemovedOfferIdsResponse)
)

export const GetRemovedClubOffersEndpoint = Api.post(
  'getRemovedClubOffers',
  '/api/v1/clubOffers/not-exist',
  {summary: 'Get removed club offers'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(RemovedClubOfferIdsRequest),
  Api.setResponseBody(RemovedOfferIdsResponse)
)

export const ReportOfferEndpoint = Api.post(
  'reportOffer',
  '/api/v1/offers/report',
  {summary: 'Report offer'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(ReportOfferRequest),
  Api.setResponseBody(ReportOfferResponse),
  Api.addResponse({
    status: 400 as const,
    body: ReportOfferEndpointErrors,
  }),
  Api.addResponse({
    status: 404 as const,
    body: NotFoundError,
  })
)

export const OfferApiSpecification = Api.make({
  title: 'Offer service',
  version: '1.0.0',
}).pipe(
  Api.addEndpoint(GetOffersByIdsEndpint),
  Api.addEndpoint(GetClubOffersByIdsEndpint),
  Api.addEndpoint(GetOffersForMeEndpoint),
  Api.addEndpoint(GetClubOffersForMeEndpoint),
  Api.addEndpoint(GetOffersForMeModifiedOrCreatedAfterEndpoint),
  Api.addEndpoint(GetClubOffersForMeModifiedOrCreatedAfterEndpoint),
  Api.addEndpoint(CreateNewOfferEndpoint),
  Api.addEndpoint(RefreshOfferEndpoint),
  Api.addEndpoint(DeleteOfferEndpoint),
  Api.addEndpoint(UpdateOfferEndpoint),
  Api.addEndpoint(CreatePrivatePartEndpoint),
  Api.addEndpoint(DeletePrivatePartEndpoint),
  Api.addEndpoint(GetRemovedOffersEndpoint),
  Api.addEndpoint(GetRemovedClubOffersEndpoint),
  Api.addEndpoint(ReportOfferEndpoint),
  Api.addGroup(ChallengeApiGroup)
)
