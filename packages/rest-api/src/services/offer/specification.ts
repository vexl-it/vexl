import {Schema} from '@effect/schema'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  CanNotDeletePrivatePartOfAuthor,
  CreateNewOfferRequestE,
  CreateNewOfferResponseE,
  CreatePrivatePartRequestE,
  CreatePrivatePartResponseE,
  DeleteOfferRequestE,
  DeleteOfferResponseE,
  DeletePrivatePartRequestE,
  DeletePrivatePartResponseE,
  DuplicatedPublicKeyError,
  GetOfferByIdsResponseE,
  GetOffersByIdsRequestE,
  GetOffersForMeCreatedOrModifiedAfterRequestE,
  GetOffersForMeCreatedOrModifiedAfterResponseE,
  GetOffersForMeResponseE,
  MissingOwnerPrivatePartError,
  RefreshOfferRequestE,
  RefreshOfferResponseE,
  RemovedOfferIdsRequestE,
  RemovedOfferIdsResponseE,
  ReportOfferLimitReachedError,
  ReportOfferRequestE,
  ReportOfferResponseE,
  UpdateOfferRequestE,
  UpdateOfferResponseE,
} from './contracts'

export const GetOffersByIdsEndpint = Api.get(
  'getOffersByIds',
  '/api/v2/offers',
  {summary: 'Get offers by ids'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(GetOffersByIdsRequestE),
  Api.setResponseBody(GetOfferByIdsResponseE)
)

export const GetOffersForMeEndpoint = Api.get(
  'getOffersForMe',
  '/api/v2/offers/me',
  {summary: 'Get offers for me'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseBody(GetOffersForMeResponseE)
)

export const GetOffersForMeModifiedOrCreatedAfterEndpoint = Api.get(
  'getOffersForMeModifiedOrCreatedAfter',
  '/api/v2/offers/me/modified',
  {summary: 'Get offers for me modified or created after'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(GetOffersForMeCreatedOrModifiedAfterRequestE),
  Api.setResponseBody(GetOffersForMeCreatedOrModifiedAfterResponseE)
)

export const CreateNewOfferErrors = Schema.Union(
  MissingOwnerPrivatePartError,
  DuplicatedPublicKeyError
)

export const CreateNewOfferEndpoint = Api.post(
  'createNewOffer',
  '/api/v2/offers',
  {summary: 'Create offer'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(CreateNewOfferRequestE),
  Api.setResponseBody(CreateNewOfferResponseE),
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
  Api.setRequestBody(RefreshOfferRequestE),
  Api.setResponseBody(RefreshOfferResponseE),
  Api.addResponse({
    status: 404 as const,
    body: NotFoundError,
  })
)

export const DeleteOfferEndpoint = Api.delete('deleteOffer', '/api/v1/offers', {
  summary: 'Delete offer',
}).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(DeleteOfferRequestE),
  Api.setResponseBody(DeleteOfferResponseE)
)

export const UpdateOfferErrors = Schema.Union(
  MissingOwnerPrivatePartError,
  DuplicatedPublicKeyError
)

export const UpdateOfferEndpoint = Api.put('updateOffer', '/api/v2/offers', {
  summary: 'Update offer',
}).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(UpdateOfferRequestE),
  Api.setResponseBody(UpdateOfferResponseE),
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
  Api.setRequestBody(CreatePrivatePartRequestE),
  Api.setResponseBody(CreatePrivatePartResponseE)
)

export const DeletePrivatePartErrors = Schema.Union(
  CanNotDeletePrivatePartOfAuthor
)
export const DeletePrivatePartEndpoint = Api.delete(
  'deletePrivatePart',
  '/api/v2/offers/private-part',
  {
    summary: 'Delete private part',
    description:
      'When offer for one of adminIds is not found, no error is returned',
  }
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(DeletePrivatePartRequestE),
  Api.setResponseBody(DeletePrivatePartResponseE),
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
  Api.setRequestBody(RemovedOfferIdsRequestE),
  Api.setResponseBody(RemovedOfferIdsResponseE)
)

export const ReportOfferEndpointErrors = Schema.Union(
  ReportOfferLimitReachedError
)
export const ReportOfferEndpoint = Api.post(
  'reportOffer',
  '/api/v1/offers/report',
  {summary: 'Report offer'}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(ReportOfferRequestE),
  Api.setResponseBody(ReportOfferResponseE),
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
  Api.addEndpoint(GetOffersForMeEndpoint),
  Api.addEndpoint(GetOffersForMeModifiedOrCreatedAfterEndpoint),
  Api.addEndpoint(CreateNewOfferEndpoint),
  Api.addEndpoint(RefreshOfferEndpoint),
  Api.addEndpoint(DeleteOfferEndpoint),
  Api.addEndpoint(UpdateOfferEndpoint),
  Api.addEndpoint(CreatePrivatePartEndpoint),
  Api.addEndpoint(DeletePrivatePartEndpoint),
  Api.addEndpoint(GetRemovedOffersEndpoint),
  Api.addEndpoint(ReportOfferEndpoint)
)
