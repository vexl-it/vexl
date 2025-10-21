import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {BtcPayServerWebhookHeader} from '../../btcPayServerWebhookHeader'
import {CommonHeaders} from '../../commonHeaders'
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
).addSuccess(EventsResponse)

export const ClearEventsCacheEndpoint = HttpApiEndpoint.post(
  'clearCache',
  '/content/clear-cache'
)
  .setUrlParams(ClearEventsCacheRequest)
  .addError(InvalidTokenError)
  .addSuccess(NoContentResponse)

export const GetBlogArticlesEndpoint = HttpApiEndpoint.get(
  'getBlogArticles',
  '/content/blogs'
).addSuccess(BlogsArticlesResponse)

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

export const GetInvoiceEndpoint = HttpApiEndpoint.get(
  'getInvoice',
  '/content/getInvoice'
)
  .setUrlParams(GetInvoiceRequest)
  .addSuccess(GetInvoiceResponse)
  .addError(GetInvoiceErrors)

export const GetInvoiceStatusTypeEndpoint = HttpApiEndpoint.get(
  'getInvoiceStatusType',
  '/content/getInvoiceStatusType'
)
  .setUrlParams(GetInvoiceStatusTypeRequest)
  .addSuccess(GetInvoiceStatusTypeResponse)
  .addError(GetInvoiceStatusTypeErrors)

export const UpdateInvoiceStateWebhookEndpoint = HttpApiEndpoint.post(
  'updateInvoiceStateWebhook',
  '/content/invoice/btcpay-webhook'
)
  .setHeaders(BtcPayServerWebhookHeader)
  .setPayload(Schema.Unknown)
  .addSuccess(NoContentResponse)
  .addError(UpdateInvoiceStatusWebhookErrors)

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
