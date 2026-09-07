import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from 'effect/unstable/httpapi'
import {
  AdminTokenHeaders,
  ClearCacheTokenHeaders,
} from '../../adminTokenHeaders'
import {BtcPayServerWebhookHeader} from '../../btcPayServerWebhookHeader'
import {commonApiErrors} from '../../commonApiErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
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
  MapStylesResponse,
  NewsAndAnnouncementsResponse,
  UpdateInvoiceWebhookError,
  VexlProductNotificationResponse,
} from './contracts'

export const GetEventsEndpoint = HttpApiEndpoint.get(
  'getEvents',
  '/content/events',
  {
    disableCodecs: true,
    error: Schema.Union([...commonApiErrors]),
    success: EventsResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const ClearEventsCacheEndpoint = HttpApiEndpoint.post(
  'clearCache',
  '/content/clear-cache',
  {
    disableCodecs: true,
    headers: ClearCacheTokenHeaders,
    error: Schema.Union([...commonApiErrors, InvalidTokenError]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 10)

export const GetBlogArticlesEndpoint = HttpApiEndpoint.get(
  'getBlogArticles',
  '/content/blogs',
  {
    disableCodecs: true,
    error: Schema.Union([...commonApiErrors]),
    success: BlogsArticlesResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

const CmsContentApiGroup = HttpApiGroup.make('Cms')
  .add(GetEventsEndpoint)
  .add(ClearEventsCacheEndpoint)
  .add(GetBlogArticlesEndpoint)

export const NewsAndAnonouncementsEndpoint = HttpApiEndpoint.get(
  'getNewsAndAnnouncements',
  '/content/news-and-announcements',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    error: Schema.Union([...commonApiErrors]),
    success: NewsAndAnnouncementsResponse,
  }
).annotate(MaxExpectedDailyCall, 500)

const NewsAndAnnouncementsApiGroup = HttpApiGroup.make(
  'NewsAndAnnouncements'
).add(NewsAndAnonouncementsEndpoint)

export const GetMapStylesEndpoint = HttpApiEndpoint.get(
  'getMapStyles',
  '/content/map-styles',
  {
    disableCodecs: true,
    error: Schema.Union([...commonApiErrors]),
    success: MapStylesResponse,
  }
).annotate(MaxExpectedDailyCall, 500)

const MapApiGroup = HttpApiGroup.make('Map').add(GetMapStylesEndpoint)

export const CreateVexlProductNotificationEndpoint = HttpApiEndpoint.post(
  'createVexlProductNotification',
  '/content/vexl-product-notifications/admin',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    payload: CreateVexlProductNotificationRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidContentAdminTokenError.pipe(HttpApiSchema.status(401)),
      DuplicateVexlProductNotificationUuidError.pipe(HttpApiSchema.status(400)),
    ]),
    success: VexlProductNotificationResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const GetVexlProductNotificationsEndpoint = HttpApiEndpoint.get(
  'getVexlProductNotifications',
  '/content/vexl-product-notifications',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    query: GetVexlProductNotificationsRequest.fields,
    error: Schema.Union([...commonApiErrors]),
    success: GetVexlProductNotificationsResponse,
  }
).annotate(MaxExpectedDailyCall, 10000)

const VexlProductNotificationsApiGroup = HttpApiGroup.make(
  'VexlProductNotifications'
)
  .add(CreateVexlProductNotificationEndpoint)
  .add(GetVexlProductNotificationsEndpoint)

export const CreateInvoiceEndpoint = HttpApiEndpoint.post(
  'createInvoice',
  '/content/createInvoice',
  {
    disableCodecs: true,
    payload: CreateInvoiceRequest,
    error: Schema.Union([
      ...commonApiErrors,
      CreateInvoiceError.pipe(HttpApiSchema.status(400)),
      InvoiceNotFoundError.pipe(HttpApiSchema.status(400)),
      GetInvoicePaymentMethodsGeneralError.pipe(HttpApiSchema.status(502)),
    ]),
    success: CreateInvoiceResponse,
  }
).annotate(MaxExpectedDailyCall, 10)

export const GetInvoiceEndpoint = HttpApiEndpoint.get(
  'getInvoice',
  '/content/getInvoice',
  {
    disableCodecs: true,
    query: GetInvoiceRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      InvoiceNotFoundError.pipe(HttpApiSchema.status(400)),
      GetInvoiceGeneralError.pipe(HttpApiSchema.status(502)),
    ]),
    success: GetInvoiceResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const GetInvoiceStatusTypeEndpoint = HttpApiEndpoint.get(
  'getInvoiceStatusType',
  '/content/getInvoiceStatusType',
  {
    disableCodecs: true,
    query: GetInvoiceStatusTypeRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      InvoiceNotFoundError.pipe(HttpApiSchema.status(400)),
      GetInvoiceGeneralError.pipe(HttpApiSchema.status(502)),
    ]),
    success: GetInvoiceStatusTypeResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const UpdateInvoiceStateWebhookEndpoint = HttpApiEndpoint.post(
  'updateInvoiceStateWebhook',
  '/content/invoice/btcpay-webhook',
  {
    disableCodecs: true,
    headers: BtcPayServerWebhookHeader,
    payload: Schema.Unknown,
    error: Schema.Union([
      ...commonApiErrors,
      UnauthorizedError.pipe(HttpApiSchema.status(401)),
      UpdateInvoiceWebhookError.pipe(HttpApiSchema.status(400)),
    ]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 1000)

const DonationsApiGroup = HttpApiGroup.make('Donations')
  .add(CreateInvoiceEndpoint)
  .add(GetInvoiceEndpoint)
  .add(UpdateInvoiceStateWebhookEndpoint)
  .add(GetInvoiceStatusTypeEndpoint)

export const ContentApiSpecification = HttpApi.make('Content API')
  .add(CmsContentApiGroup)
  .add(NewsAndAnnouncementsApiGroup)
  .add(MapApiGroup)
  .add(VexlProductNotificationsApiGroup)
  .add(DonationsApiGroup)
  .middleware(RateLimitingMiddleware)
