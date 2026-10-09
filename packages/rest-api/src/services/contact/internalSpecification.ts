import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {AdminTokenHeaders} from '../../adminTokenHeaders'
import {
  ClubAlreadyExistsError,
  ClubCannotBeReactivatedError,
  CreateClubRequest,
  CreateClubResponse,
  GenerateInviteLinkForAdminRequest,
  GenerateInviteLinkForAdminResponse,
  GetClubStatsRequest,
  GetClubStatsResponse,
  InvalidAdminTokenError,
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
  .setHeaders(AdminTokenHeaders)
  .setPayload(CreateClubRequest)
  .addSuccess(CreateClubResponse)
  .addError(ClubAlreadyExistsError, {status: 400})
  .addError(InvalidAdminTokenError, {status: 401})

export const ModfiyClubEndpoint = HttpApiEndpoint.put(
  'modifyClub',
  '/api/v1/clubs/admin'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(ModifyClubRequest)
  .addSuccess(ModifyClubResponse)
  .addError(InvalidAdminTokenError, {status: 401})

export const GenerateClubInviteLinkForAdminEndpoint = HttpApiEndpoint.put(
  'generateClubInviteLinkForAdmin',
  '/api/v1/clubs/admin/generate-admin-link'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(GenerateInviteLinkForAdminRequest)
  .addSuccess(GenerateInviteLinkForAdminResponse)
  .addError(InvalidAdminTokenError, {status: 401})

export const ListClubsEndpoint = HttpApiEndpoint.get(
  'listClubs',
  '/api/v1/clubs/admin'
)
  .setHeaders(AdminTokenHeaders)
  .addSuccess(ListClubsResponse)
  .addError(InvalidAdminTokenError, {status: 401})

export const GetClubStatsEndpoint = HttpApiEndpoint.get(
  'getClubStats',
  '/api/v1/clubs/admin/stats'
)
  .setHeaders(AdminTokenHeaders)
  .setUrlParams(GetClubStatsRequest)
  .addSuccess(GetClubStatsResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .addError(NotFoundError, {status: 404})

export const ReactivateClubEndpoint = HttpApiEndpoint.put(
  'reactivateClub',
  '/api/v1/clubs/admin/reactivate'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(ReactivateClubRequest)
  .addSuccess(ReactivateClubResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .addError(ClubCannotBeReactivatedError, {status: 400})
  .addError(NotFoundError, {status: 404})

export const RequestClubImageUploadEndpoint = HttpApiEndpoint.post(
  'requestClubImageUpload',
  '/api/v1/clubs/admin/request-image-upload'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(RequestClubImageUploadRequest)
  .addSuccess(RequestClubImageUploadResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .addError(S3ServiceError, {status: 502})

export const TestHashingSpeedEndpoint = HttpApiEndpoint.post(
  'testHashingSpeed',
  '/test-hashing-speed'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(TestHashingSpeedRequest)
  .addSuccess(TestHashingSpeedResponse)
  .addError(InvalidAdminTokenError, {status: 401})

const ClubsAdminApiGroup = HttpApiGroup.make('ClubsAdmin')
  .add(CreateClubEndpoint)
  .add(ModfiyClubEndpoint)
  .add(GenerateClubInviteLinkForAdminEndpoint)
  .add(ListClubsEndpoint)
  .add(GetClubStatsEndpoint)
  .add(ReactivateClubEndpoint)
  .add(RequestClubImageUploadEndpoint)

const DebugApiGroup = HttpApiGroup.make('Debug').add(TestHashingSpeedEndpoint)

export const ContactInternalApiSpecification = HttpApi.make(
  'Contact Internal API'
)
  .add(ClubsAdminApiGroup)
  .add(DebugApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
