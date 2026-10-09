import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {AdminTokenHeaders} from '../../adminTokenHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  CreateVexlProductNotificationRequest,
  DuplicateVexlProductNotificationUuidError,
  InvalidContentAdminTokenError,
  InvalidTokenError,
  VexlProductNotificationResponse,
} from './contracts'

export const ClearEventsCacheEndpoint = HttpApiEndpoint.post(
  'clearCache',
  '/content/clear-cache'
)
  .setHeaders(AdminTokenHeaders)
  .addError(InvalidTokenError, {status: 401})
  .addSuccess(NoContentResponse)

export const CreateVexlProductNotificationEndpoint = HttpApiEndpoint.post(
  'createVexlProductNotification',
  '/content/vexl-product-notifications/admin'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(CreateVexlProductNotificationRequest)
  .addSuccess(VexlProductNotificationResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})
  .addError(DuplicateVexlProductNotificationUuidError, {status: 400})

const CmsApiGroup = HttpApiGroup.make('Cms').add(ClearEventsCacheEndpoint)

const VexlProductNotificationsApiGroup = HttpApiGroup.make(
  'VexlProductNotifications'
).add(CreateVexlProductNotificationEndpoint)

export const ContentInternalApiSpecification = HttpApi.make(
  'Content Internal API'
)
  .add(CmsApiGroup)
  .add(VexlProductNotificationsApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
