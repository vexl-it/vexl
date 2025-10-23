import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
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
  CreateInvoiceErrors,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  EventsResponse,
  GetInvoiceErrors,
  GetInvoiceRequest,
  GetInvoiceResponse,
  GetInvoiceStatusTypeErrors,
  GetInvoiceStatusTypeRequest,
  GetInvoiceStatusTypeResponse,
  InvalidTokenError,
  NewsAndAnnouncementsResponse,
  UpdateInvoiceStatusWebhookErrors,
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
  .addError(CreateInvoiceErrors)
  .annotate(MaxExpectedDailyCall, 10)

export const GetInvoiceEndpoint = HttpApiEndpoint.get(
  'getInvoice',
  '/content/getInvoice'
)
  .setUrlParams(GetInvoiceRequest)
  .addSuccess(GetInvoiceResponse)
  .addError(GetInvoiceErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const GetInvoiceStatusTypeEndpoint = HttpApiEndpoint.get(
  'getInvoiceStatusType',
  '/content/getInvoiceStatusType'
)
  .setUrlParams(GetInvoiceStatusTypeRequest)
  .addSuccess(GetInvoiceStatusTypeResponse)
  .addError(GetInvoiceStatusTypeErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const UpdateInvoiceStateWebhookEndpoint = HttpApiEndpoint.post(
  'updateInvoiceStateWebhook',
  '/content/invoice/btcpay-webhook'
)
  .setHeaders(BtcPayServerWebhookHeader)
  .setPayload(Schema.Unknown)
  .addSuccess(NoContentResponse)
  .addError(UpdateInvoiceStatusWebhookErrors)
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
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
