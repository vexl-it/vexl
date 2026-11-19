import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  InvalidNextPageTokenError,
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {AdminTokenMiddleware} from '../../adminTokenMiddleware'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  AddBannedNumbersRequest,
  AddBannedNumbersResponse,
  BannedNumbersMonthlyLimitReachedError,
  ClubAlreadyExistsError,
  ClubCannotBeReactivatedError,
  CreateClubRequest,
  CreateClubResponse,
  DeleteBannedNumberPath,
  GenerateInviteLinkForAdminRequest,
  GenerateInviteLinkForAdminResponse,
  GetClubStatsRequest,
  GetClubStatsResponse,
  ListBannedNumbersRequest,
  ListBannedNumbersResponse,
  ListClubsResponse,
  ModifyClubRequest,
  ModifyClubResponse,
  ReactivateClubRequest,
  ReactivateClubResponse,
  RequestClubImageUploadRequest,
  RequestClubImageUploadResponse,
  S3ServiceError,
  TestHashingSpeedRequest,
  TestHashingSpeedResponse,
} from './contracts'

export const CreateClubEndpoint = HttpApiEndpoint.post(
  'createClub',
  '/api/v1/clubs/admin'
)
  .setPayload(CreateClubRequest)
  .addSuccess(CreateClubResponse)
  .addError(ClubAlreadyExistsError, {status: 400})

export const ModfiyClubEndpoint = HttpApiEndpoint.put(
  'modifyClub',
  '/api/v1/clubs/admin'
)
  .setPayload(ModifyClubRequest)
  .addSuccess(ModifyClubResponse)

export const GenerateClubInviteLinkForAdminEndpoint = HttpApiEndpoint.put(
  'generateClubInviteLinkForAdmin',
  '/api/v1/clubs/admin/generate-admin-link'
)
  .setPayload(GenerateInviteLinkForAdminRequest)
  .addSuccess(GenerateInviteLinkForAdminResponse)

export const ListClubsEndpoint = HttpApiEndpoint.get(
  'listClubs',
  '/api/v1/clubs/admin'
).addSuccess(ListClubsResponse)

export const GetClubStatsEndpoint = HttpApiEndpoint.get(
  'getClubStats',
  '/api/v1/clubs/admin/stats'
)
  .setUrlParams(GetClubStatsRequest)
  .addSuccess(GetClubStatsResponse)
  .addError(NotFoundError, {status: 404})

export const ReactivateClubEndpoint = HttpApiEndpoint.put(
  'reactivateClub',
  '/api/v1/clubs/admin/reactivate'
)
  .setPayload(ReactivateClubRequest)
  .addSuccess(ReactivateClubResponse)
  .addError(ClubCannotBeReactivatedError, {status: 400})
  .addError(NotFoundError, {status: 404})

export const RequestClubImageUploadEndpoint = HttpApiEndpoint.post(
  'requestClubImageUpload',
  '/api/v1/clubs/admin/request-image-upload'
)
  .setPayload(RequestClubImageUploadRequest)
  .addSuccess(RequestClubImageUploadResponse)
  .addError(S3ServiceError, {status: 502})

// POST so searched numbers stay out of URLs and access logs
export const ListBannedNumbersEndpoint = HttpApiEndpoint.post(
  'listBannedNumbers',
  '/api/v1/banned-numbers/admin/list'
)
  .setPayload(ListBannedNumbersRequest)
  .addSuccess(ListBannedNumbersResponse)
  .addError(InvalidNextPageTokenError, {status: 400})

export const AddBannedNumbersEndpoint = HttpApiEndpoint.post(
  'addBannedNumbers',
  '/api/v1/banned-numbers/admin'
)
  .setPayload(AddBannedNumbersRequest)
  .addSuccess(AddBannedNumbersResponse)
  .addError(BannedNumbersMonthlyLimitReachedError, {status: 429})

export const DeleteBannedNumberEndpoint = HttpApiEndpoint.del(
  'deleteBannedNumber',
  '/api/v1/banned-numbers/admin/:id'
)
  .setPath(DeleteBannedNumberPath)
  .addSuccess(NoContentResponse)

export const TestHashingSpeedEndpoint = HttpApiEndpoint.post(
  'testHashingSpeed',
  '/test-hashing-speed'
)
  .setPayload(TestHashingSpeedRequest)
  .addSuccess(TestHashingSpeedResponse)

const ClubsAdminApiGroup = HttpApiGroup.make('ClubsAdmin')
  .add(CreateClubEndpoint)
  .add(ModfiyClubEndpoint)
  .add(GenerateClubInviteLinkForAdminEndpoint)
  .add(ListClubsEndpoint)
  .add(GetClubStatsEndpoint)
  .add(ReactivateClubEndpoint)
  .add(RequestClubImageUploadEndpoint)

const BannedNumbersAdminApiGroup = HttpApiGroup.make('BannedNumbersAdmin')
  .add(ListBannedNumbersEndpoint)
  .add(AddBannedNumbersEndpoint)
  .add(DeleteBannedNumberEndpoint)

const DebugApiGroup = HttpApiGroup.make('Debug').add(TestHashingSpeedEndpoint)

export const ContactInternalApiSpecification = HttpApi.make(
  'Contact Internal API'
)
  .add(ClubsAdminApiGroup)
  .add(BannedNumbersAdminApiGroup)
  .add(DebugApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
  .middleware(AdminTokenMiddleware)
