import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {BtcPayServerWebhookHeader} from '../../btcPayServerWebhookHeader'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  BlogsArticlesResponse,
  ClearEventsCacheRequest,
  CreateInvoiceError,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  EventsResponse,
  GetInvoiceGeneralError,
  GetInvoicePaymentMethodsGeneralError,
  GetInvoiceRequest,
  GetInvoiceResponse,
  GetInvoiceStatusTypeRequest,
  GetInvoiceStatusTypeResponse,
  InvalidTokenError,
  InvoiceNotFoundError,
  NewsAndAnnouncementsResponse,
  UpdateInvoiceWebhookError,
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
  .setUrlParams(ClearEventsCacheRequest)
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
  .add(DonationsApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
