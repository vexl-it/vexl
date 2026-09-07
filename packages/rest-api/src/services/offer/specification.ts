import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from 'effect/unstable/httpapi'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {InvalidChallengeError} from '../../challenges/contracts'
import {ChallengeApiGroup} from '../../challenges/specification'
import {commonApiErrors} from '../../commonApiErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  CanNotDeletePrivatePartOfAuthor,
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
  GetOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  GetOffersForMeCreatedOrModifiedAfterPaginatedResponse,
  MissingOwnerPrivatePartError,
  RefreshOfferRequest,
  RefreshOfferResponse,
  RemovedClubOfferIdsRequest,
  RemovedOfferIdsRequest,
  RemovedOfferIdsResponse,
  ReportClubOfferRequest,
  ReportClubOfferResponse,
  ReportOfferLimitReachedError,
  ReportOfferRequest,
  ReportOfferResponse,
  UpdateOfferRequest,
  UpdateOfferResponse,
} from './contracts'
import {NotesApiGroup} from './notesSpecification'

export const GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint =
  HttpApiEndpoint.get(
    'getOffersForMeModifiedOrCreatedAfterPaginated',
    '/api/v2/offers/me/modified/paginated',
    {
      disableCodecs: true,
      headers: CommonAndSecurityHeaders,
      query: GetOffersForMeCreatedOrModifiedAfterPaginatedRequest.fields,
      error: Schema.Union([
        ...commonApiErrors,
        InvalidNextPageTokenError.pipe(HttpApiSchema.status(400)),
      ]),
      success: GetOffersForMeCreatedOrModifiedAfterPaginatedResponse,
    }
  )
    .annotate(
      OpenApi.Summary,
      'Get offers for me modified or created after (paginated)'
    )
    .middleware(ServerSecurityMiddleware)
    .annotate(MaxExpectedDailyCall, 600)

export const GetClubOffersForMeModifiedOrCreatedAfterPaginatedEndpoint =
  HttpApiEndpoint.post(
    'getClubOffersForMeModifiedOrCreatedAfterPaginated',
    '/api/v2/clubOffers/me/modified/paginated',
    {
      disableCodecs: true,
      payload: GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest,
      error: Schema.Union([
        ...commonApiErrors,
        InvalidChallengeError.pipe(HttpApiSchema.status(401)),
        InvalidNextPageTokenError.pipe(HttpApiSchema.status(400)),
      ]),
      success: GetOffersForMeCreatedOrModifiedAfterPaginatedResponse,
    }
  )
    .annotate(
      OpenApi.Summary,
      'Get club offers for me modified or created after (paginated)'
    )
    .annotate(MaxExpectedDailyCall, 600)

export const CreateNewOfferEndpoint = HttpApiEndpoint.post(
  'createNewOffer',
  '/api/v2/offers',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: CreateNewOfferRequest,
    error: Schema.Union([
      ...commonApiErrors,
      MissingOwnerPrivatePartError.pipe(HttpApiSchema.status(400)),
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
    ]),
    success: CreateNewOfferResponse,
  }
)
  .annotate(OpenApi.Summary, 'Create offer')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 50)

export const RefreshOfferEndpoint = HttpApiEndpoint.post(
  'refreshOffer',
  '/api/v2/offers/refresh',
  {
    disableCodecs: true,
    payload: RefreshOfferRequest,
    error: Schema.Union([...commonApiErrors]),
    success: RefreshOfferResponse,
  }
)
  .annotate(OpenApi.Summary, 'Refresh offer')
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteOfferEndpoint = HttpApiEndpoint.delete(
  'deleteOffer',
  '/api/v1/offers',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    query: DeleteOfferRequest.fields,
    error: Schema.Union([...commonApiErrors]),
    success: DeleteOfferResponse,
  }
)
  .annotate(OpenApi.Summary, 'Delete offer')
  .annotate(MaxExpectedDailyCall, 50)

export const UpdateOfferEndpoint = HttpApiEndpoint.put(
  'updateOffer',
  '/api/v2/offers',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: UpdateOfferRequest,
    error: Schema.Union([
      ...commonApiErrors,
      MissingOwnerPrivatePartError.pipe(HttpApiSchema.status(400)),
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
    ]),
    success: UpdateOfferResponse,
  }
)
  .annotate(OpenApi.Summary, 'Update offer')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 50)

export const CreatePrivatePartEndpoint = HttpApiEndpoint.post(
  'createPrivatePart',
  '/api/v2/offers/private-part',
  {
    disableCodecs: true,
    payload: CreatePrivatePartRequest,
    error: Schema.Union([
      ...commonApiErrors,
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
    ]),
    success: CreatePrivatePartResponse,
  }
)
  .annotate(OpenApi.Summary, 'Create private part')
  .annotate(MaxExpectedDailyCall, 100)

export const DeletePrivatePartEndpoint = HttpApiEndpoint.delete(
  'deletePrivatePart',
  '/api/v1/offers/private-part',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: DeletePrivatePartRequest,
    error: Schema.Union([
      ...commonApiErrors,
      CanNotDeletePrivatePartOfAuthor.pipe(HttpApiSchema.status(400)),
    ]),
    success: DeletePrivatePartResponse,
  }
)
  .annotate(OpenApi.Summary, 'Delete private part')
  .annotate(
    OpenApi.Description,
    'When offer for one of adminIds is not found, no error is returned'
  )
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

export const GetRemovedOffersEndpoint = HttpApiEndpoint.post(
  'getRemovedOffers',
  '/api/v1/offers/not-exist',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: RemovedOfferIdsRequest,
    error: Schema.Union([...commonApiErrors]),
    success: RemovedOfferIdsResponse,
  }
)
  .annotate(OpenApi.Summary, 'Get removed offers')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

export const GetRemovedClubOffersEndpoint = HttpApiEndpoint.post(
  'getRemovedClubOffers',
  '/api/v1/clubOffers/not-exist',
  {
    disableCodecs: true,
    payload: RemovedClubOfferIdsRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: RemovedOfferIdsResponse,
  }
)
  .annotate(OpenApi.Summary, 'Get removed club offers')
  .annotate(MaxExpectedDailyCall, 100)

export const ReportOfferEndpoint = HttpApiEndpoint.post(
  'reportOffer',
  '/api/v1/offers/report',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: ReportOfferRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReportOfferLimitReachedError.pipe(HttpApiSchema.status(429)),
    ]),
    success: ReportOfferResponse,
  }
)
  .annotate(OpenApi.Summary, 'Report offer')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 10)

export const ReportClubOfferEndpoint = HttpApiEndpoint.post(
  'reportClubOffer',
  '/api/v1/clubOffers/report',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: ReportClubOfferRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReportOfferLimitReachedError.pipe(HttpApiSchema.status(429)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: ReportClubOfferResponse,
  }
)
  .annotate(OpenApi.Summary, 'Report club offer')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 10)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint)
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
  .add(NotesApiGroup)
  .middleware(RateLimitingMiddleware)
