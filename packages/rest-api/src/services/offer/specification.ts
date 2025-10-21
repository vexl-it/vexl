import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from '@effect/platform/index'
import {
  InvalidNextPageTokenError,
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ServerSecurityMiddleware} from '../../apiSecurity'
import {InvalidChallengeError} from '../../challenges/contracts'
import {ChallengeApiGroup} from '../../challenges/specification'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
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
  GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  GetClubOffersForMeCreatedOrModifiedAfterRequest,
  GetOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  GetOffersForMeCreatedOrModifiedAfterPaginatedResponse,
  GetOffersForMeCreatedOrModifiedAfterRequest,
  GetOffersForMeCreatedOrModifiedAfterResponse,
  RefreshOfferRequest,
  RefreshOfferResponse,
  RemovedClubOfferIdsRequest,
  RemovedOfferIdsRequest,
  RemovedOfferIdsResponse,
  ReportClubOfferEndpointErrors,
  ReportClubOfferRequest,
  ReportClubOfferResponse,
  ReportOfferEndpointErrors,
  ReportOfferRequest,
  ReportOfferResponse,
  UpdateOfferErrors,
  UpdateOfferRequest,
  UpdateOfferResponse,
} from './contracts'

export const GetOffersForMeModifiedOrCreatedAfterEndpoint = HttpApiEndpoint.get(
  'getOffersForMeModifiedOrCreatedAfter',
  '/api/v2/offers/me/modified'
)
  .annotate(OpenApi.Summary, 'Get offers for me modified or created after')
  .middleware(ServerSecurityMiddleware)
  .setUrlParams(GetOffersForMeCreatedOrModifiedAfterRequest)
  .addSuccess(GetOffersForMeCreatedOrModifiedAfterResponse)
  .annotate(MaxExpectedDailyCall, 200)

export const GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint =
  HttpApiEndpoint.get(
    'getOffersForMeModifiedOrCreatedAfterPaginated',
    '/api/v2/offers/me/modified/paginated'
  )
    .annotate(
      OpenApi.Summary,
      'Get offers for me modified or created after (paginated)'
    )
    .middleware(ServerSecurityMiddleware)
    .setUrlParams(GetOffersForMeCreatedOrModifiedAfterPaginatedRequest)
    .addSuccess(GetOffersForMeCreatedOrModifiedAfterPaginatedResponse)
    .addError(InvalidNextPageTokenError)
    .annotate(MaxExpectedDailyCall, 600)

export const GetClubOffersForMeModifiedOrCreatedAfterEndpoint =
  HttpApiEndpoint.post(
    'getClubOffersForMeModifiedOrCreatedAfter',
    '/api/v2/clubOffers/me/modified'
  )
    .annotate(
      OpenApi.Summary,
      'Get club offers for me modified or created after'
    )
    .middleware(ServerSecurityMiddleware)
    .setPayload(GetClubOffersForMeCreatedOrModifiedAfterRequest)
    .addSuccess(GetOffersForMeCreatedOrModifiedAfterResponse)
    .addError(InvalidChallengeError)
    .annotate(MaxExpectedDailyCall, 200)

export const GetClubOffersForMeModifiedOrCreatedAfterPaginatedEndpoint =
  HttpApiEndpoint.post(
    'getClubOffersForMeModifiedOrCreatedAfterPaginated',
    '/api/v2/clubOffers/me/modified/paginated'
  )
    .annotate(
      OpenApi.Summary,
      'Get club offers for me modified or created after (paginated)'
    )
    .middleware(ServerSecurityMiddleware)
    .setPayload(GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest)
    .addSuccess(GetOffersForMeCreatedOrModifiedAfterPaginatedResponse)
    .addError(InvalidChallengeError)
    .addError(InvalidNextPageTokenError)
    .annotate(MaxExpectedDailyCall, 600)

export const CreateNewOfferEndpoint = HttpApiEndpoint.post(
  'createNewOffer',
  '/api/v2/offers'
)
  .annotate(OpenApi.Summary, 'Create offer')
  .middleware(ServerSecurityMiddleware)
  .setPayload(CreateNewOfferRequest)
  .addSuccess(CreateNewOfferResponse)
  .addError(CreateNewOfferErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const RefreshOfferEndpoint = HttpApiEndpoint.post(
  'refreshOffer',
  '/api/v2/offers/refresh'
)
  .annotate(OpenApi.Summary, 'Refresh offer')
  .middleware(ServerSecurityMiddleware)
  .setPayload(RefreshOfferRequest)
  .addSuccess(RefreshOfferResponse)
  .addError(NotFoundError)
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteOfferEndpoint = HttpApiEndpoint.del(
  'deleteOffer',
  '/api/v1/offers'
)
  .annotate(OpenApi.Summary, 'Delete offer')
  .middleware(ServerSecurityMiddleware)
  .setUrlParams(DeleteOfferRequest)
  .addSuccess(DeleteOfferResponse)
  .annotate(MaxExpectedDailyCall, 50)

export const UpdateOfferEndpoint = HttpApiEndpoint.put(
  'updateOffer',
  '/api/v2/offers'
)
  .annotate(OpenApi.Summary, 'Update offer')
  .middleware(ServerSecurityMiddleware)
  .setPayload(UpdateOfferRequest)
  .addSuccess(UpdateOfferResponse)
  .addError(UpdateOfferErrors)
  .addError(NotFoundError)
  .annotate(MaxExpectedDailyCall, 50)

export const CreatePrivatePartEndpoint = HttpApiEndpoint.post(
  'createPrivatePart',
  '/api/v2/offers/private-part'
)
  .annotate(OpenApi.Summary, 'Create private part')
  .middleware(ServerSecurityMiddleware)
  .setPayload(CreatePrivatePartRequest)
  .addSuccess(CreatePrivatePartResponse)
  .addError(DuplicatedPublicKeyError)
  .annotate(MaxExpectedDailyCall, 100)

export const DeletePrivatePartEndpoint = HttpApiEndpoint.del(
  'deletePrivatePart',
  '/api/v1/offers/private-part'
)
  .annotate(OpenApi.Summary, 'Delete private part')
  .annotate(
    OpenApi.Description,
    'When offer for one of adminIds is not found, no error is returned'
  )
  .middleware(ServerSecurityMiddleware)
  .setPayload(DeletePrivatePartRequest)
  .addSuccess(DeletePrivatePartResponse)
  .addError(CanNotDeletePrivatePartOfAuthor)
  .annotate(MaxExpectedDailyCall, 100)

export const GetRemovedOffersEndpoint = HttpApiEndpoint.post(
  'getRemovedOffers',
  '/api/v1/offers/not-exist'
)
  .annotate(OpenApi.Summary, 'Get removed offers')
  .middleware(ServerSecurityMiddleware)
  .setPayload(RemovedOfferIdsRequest)
  .addSuccess(RemovedOfferIdsResponse)
  .annotate(MaxExpectedDailyCall, 100)

export const GetRemovedClubOffersEndpoint = HttpApiEndpoint.post(
  'getRemovedClubOffers',
  '/api/v1/clubOffers/not-exist'
)
  .annotate(OpenApi.Summary, 'Get removed club offers')
  .middleware(ServerSecurityMiddleware)
  .setPayload(RemovedClubOfferIdsRequest)
  .addSuccess(RemovedOfferIdsResponse)
  .addError(InvalidChallengeError)
  .annotate(MaxExpectedDailyCall, 100)

export const ReportOfferEndpoint = HttpApiEndpoint.post(
  'reportOffer',
  '/api/v1/offers/report'
)
  .annotate(OpenApi.Summary, 'Report offer')
  .middleware(ServerSecurityMiddleware)
  .setPayload(ReportOfferRequest)
  .addSuccess(ReportOfferResponse)
  .addError(ReportOfferEndpointErrors)
  .addError(NotFoundError)
  .annotate(MaxExpectedDailyCall, 10)

export const ReportClubOfferEndpoint = HttpApiEndpoint.post(
  'reportClubOffer',
  '/api/v1/clubOffers/report'
)
  .annotate(OpenApi.Summary, 'Report club offer')
  .middleware(ServerSecurityMiddleware)
  .setPayload(ReportClubOfferRequest)
  .addSuccess(ReportClubOfferResponse)
  .addError(ReportClubOfferEndpointErrors)
  .addError(NotFoundError)
  .annotate(MaxExpectedDailyCall, 10)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(GetOffersForMeModifiedOrCreatedAfterEndpoint)
  .add(GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint)
  .add(GetClubOffersForMeModifiedOrCreatedAfterEndpoint)
  .add(GetClubOffersForMeModifiedOrCreatedAfterPaginatedEndpoint)
  .add(CreateNewOfferEndpoint)
  .add(RefreshOfferEndpoint)
  .add(DeleteOfferEndpoint)
  .add(UpdateOfferEndpoint)
  .add(CreatePrivatePartEndpoint)
  .add(DeletePrivatePartEndpoint)
  .add(GetRemovedOffersEndpoint)
  .add(GetRemovedClubOffersEndpoint)
  .add(ReportOfferEndpoint)
  .add(ReportClubOfferEndpoint)

export const OfferApiSpecification = HttpApi.make('Offer API')
  .add(RootGroup)
  .add(ChallengeApiGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
