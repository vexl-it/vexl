import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {
  AdminTokenHeaders,
  ClearCacheTokenHeaders,
} from '../../adminTokenHeaders'
import {BtcPayServerWebhookHeader} from '../../btcPayServerWebhookHeader'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  BlogsArticlesResponse,
  CreateInvoiceError,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CreateVexlProductNotificationRequest,
  DuplicateVexlProductNotificationUuidError,
  EventsResponse,
  GetInvoiceGeneralError,
  GetInvoicePaymentMethodsGeneralError,
  GetInvoiceRequest,
  GetInvoiceResponse,
  GetInvoiceStatusTypeRequest,
  GetInvoiceStatusTypeResponse,
  GetVexlProductNotificationsRequest,
  GetVexlProductNotificationsResponse,
  InvalidContentAdminTokenError,
  InvalidTokenError,
  InvoiceNotFoundError,
  NewsAndAnnouncementsResponse,
  UpdateInvoiceWebhookError,
  VexlProductNotificationResponse,
} from './contracts'

export const GetEventsEndpoint = HttpApiEndpoint.get(
  'getEvents',
  '/content/events'
)
  .addSuccess(EventsResponse)
  .annotate(MaxExpectedDailyCall, 100)

export const ClearEventsCacheEndpoint = HttpApiEndpoint.post(
  'clearCache',
  '/content/clear-cache'
)
  .setHeaders(ClearCacheTokenHeaders)
  .addError(InvalidTokenError)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 10)

export const GetBlogArticlesEndpoint = HttpApiEndpoint.get(
  'getBlogArticles',
  '/content/blogs'
)
  .addSuccess(BlogsArticlesResponse)
  .annotate(MaxExpectedDailyCall, 100)

const CmsContentApiGroup = HttpApiGroup.make('Cms')
  .add(GetEventsEndpoint)
  .add(ClearEventsCacheEndpoint)
  .add(GetBlogArticlesEndpoint)

export const NewsAndAnonouncementsEndpoint = HttpApiEndpoint.get(
  'getNewsAndAnnouncements',
  '/content/news-and-announcements'
)
  .setHeaders(CommonHeaders)
  .addSuccess(NewsAndAnnouncementsResponse)
  .annotate(MaxExpectedDailyCall, 500)

const NewsAndAnnouncementsApiGroup = HttpApiGroup.make(
  'NewsAndAnnouncements'
).add(NewsAndAnonouncementsEndpoint)

export const CreateVexlProductNotificationEndpoint = HttpApiEndpoint.post(
  'createVexlProductNotification',
  '/content/vexl-product-notifications/admin'
)
  .setHeaders(AdminTokenHeaders)
  .setPayload(CreateVexlProductNotificationRequest)
  .addSuccess(VexlProductNotificationResponse)
  .addError(InvalidContentAdminTokenError, {status: 401})
  .addError(DuplicateVexlProductNotificationUuidError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const GetVexlProductNotificationsEndpoint = HttpApiEndpoint.get(
  'getVexlProductNotifications',
  '/content/vexl-product-notifications'
)
  .setHeaders(CommonHeaders)
  .setUrlParams(GetVexlProductNotificationsRequest)
  .addSuccess(GetVexlProductNotificationsResponse)
  .annotate(MaxExpectedDailyCall, 10000)

const VexlProductNotificationsApiGroup = HttpApiGroup.make(
  'VexlProductNotifications'
)
  .add(CreateVexlProductNotificationEndpoint)
  .add(GetVexlProductNotificationsEndpoint)

export const CreateInvoiceEndpoint = HttpApiEndpoint.post(
  'createInvoice',
  '/content/createInvoice'
)
  .setPayload(CreateInvoiceRequest)
  .addSuccess(CreateInvoiceResponse)
  .addError(CreateInvoiceError, {status: 400})
  .addError(InvoiceNotFoundError, {status: 400})
  .addError(GetInvoicePaymentMethodsGeneralError, {status: 502})
  .annotate(MaxExpectedDailyCall, 10)

export const GetInvoiceEndpoint = HttpApiEndpoint.get(
  'getInvoice',
  '/content/getInvoice'
)
  .setUrlParams(GetInvoiceRequest)
  .addSuccess(GetInvoiceResponse)
  .addError(InvoiceNotFoundError, {status: 400})
  .addError(GetInvoiceGeneralError, {status: 502})
  .annotate(MaxExpectedDailyCall, 50)

export const GetInvoiceStatusTypeEndpoint = HttpApiEndpoint.get(
  'getInvoiceStatusType',
  '/content/getInvoiceStatusType'
)
  .setUrlParams(GetInvoiceStatusTypeRequest)
  .addSuccess(GetInvoiceStatusTypeResponse)
  .addError(InvoiceNotFoundError, {status: 400})
  .addError(GetInvoiceGeneralError, {status: 502})
  .annotate(MaxExpectedDailyCall, 50)

export const UpdateInvoiceStateWebhookEndpoint = HttpApiEndpoint.post(
  'updateInvoiceStateWebhook',
  '/content/invoice/btcpay-webhook'
)
  .setHeaders(BtcPayServerWebhookHeader)
  .setPayload(Schema.Unknown)
  .addSuccess(NoContentResponse)
  .addError(UnauthorizedError, {status: 401})
  .addError(UpdateInvoiceWebhookError, {status: 400})
  .annotate(MaxExpectedDailyCall, 1000)

const DonationsApiGroup = HttpApiGroup.make('Donations')
  .add(CreateInvoiceEndpoint)
  .add(GetInvoiceEndpoint)
  .add(UpdateInvoiceStateWebhookEndpoint)
  .add(GetInvoiceStatusTypeEndpoint)

export const ContentApiSpecification = HttpApi.make('Content API')
  .add(CmsContentApiGroup)
  .add(NewsAndAnnouncementsApiGroup)
  .add(VexlProductNotificationsApiGroup)
  .add(DonationsApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
