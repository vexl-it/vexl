import {Schema} from 'effect'
import {Api, ApiGroup} from 'effect-http'
import {BtcPayServerWebhookHeader} from '../../btcPayServerWebhookHeader'
import {CommonHeaders} from '../../commonHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  BlogsArticlesResponse,
  ClearEventsCacheRequest,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  EventsResponse,
  GetInvoiceRequest,
  GetInvoiceResponse,
  GetInvoiceStatusTypeRequest,
  GetInvoiceStatusTypeResponse,
  NewsAndAnnouncementsResponse,
} from './contracts'

export const GetEventsEndpoint = Api.get('getEvents', '/content/events').pipe(
  Api.setResponseBody(EventsResponse),
  Api.setResponseStatus(200 as const)
)

export const ClearEventsCacheEndpoint = Api.post(
  'clearCache',
  '/content/clear-cache'
).pipe(
  Api.setRequestQuery(ClearEventsCacheRequest),
  Api.setResponseBody(NoContentResponse),
  Api.setResponseStatus(200 as const)
)

export const GetBlogArticlesEndpoint = Api.get(
  'getBlogArticles',
  '/content/blogs'
).pipe(
  Api.setResponseBody(BlogsArticlesResponse),
  Api.setResponseStatus(200 as const)
)

export const CmsContentApiGroup = ApiGroup.make('Cms content').pipe(
  ApiGroup.addEndpoint(GetEventsEndpoint),
  ApiGroup.addEndpoint(ClearEventsCacheEndpoint),
  ApiGroup.addEndpoint(GetBlogArticlesEndpoint)
)

export const NewsAndAnonouncementsEndpoint = Api.get(
  'getNewsAndAnnouncements',
  '/content/news-and-announcements'
).pipe(
  Api.setRequestHeaders(CommonHeaders),
  Api.setResponseBody(NewsAndAnnouncementsResponse),
  Api.setResponseStatus(200 as const)
)
export const NewsAndAnnouncementsApiGroup = ApiGroup.make(
  'News and Announcements'
).pipe(ApiGroup.addEndpoint(NewsAndAnonouncementsEndpoint))

export const CreateInvoiceEndpoint = Api.post(
  'createInvoice',
  '/content/createInvoice'
).pipe(
  Api.setRequestBody(CreateInvoiceRequest),
  Api.setResponseBody(CreateInvoiceResponse),
  Api.setResponseStatus(200 as const)
)

export const GetInvoiceEndpoint = Api.get(
  'getInvoice',
  '/content/getInvoice'
).pipe(
  Api.setRequestQuery(GetInvoiceRequest),
  Api.setResponseBody(GetInvoiceResponse),
  Api.setResponseStatus(200 as const)
)

export const GetInvoiceStatusTypeEndpoint = Api.get(
  'getInvoiceStatusType',
  '/content/getInvoiceStatusType'
).pipe(
  Api.setRequestQuery(GetInvoiceStatusTypeRequest),
  Api.setResponseBody(GetInvoiceStatusTypeResponse),
  Api.setResponseStatus(200 as const)
)

export const UpdateInvoiceStateWebhookEndpoint = Api.post(
  'updateInvoiceStateWebhook',
  '/content/invoice/btcpay-webhook'
).pipe(
  Api.setRequestHeaders(BtcPayServerWebhookHeader),
  // need to be unknown as we need whole raw body to verify sha256 signature
  Api.setRequestBody(Schema.Unknown),
  Api.setResponseBody(NoContentResponse),
  Api.setResponseStatus(200 as const)
)

export const DonationsApiGroup = ApiGroup.make('Donations').pipe(
  ApiGroup.addEndpoint(CreateInvoiceEndpoint),
  ApiGroup.addEndpoint(GetInvoiceEndpoint),
  ApiGroup.addEndpoint(UpdateInvoiceStateWebhookEndpoint),
  ApiGroup.addEndpoint(GetInvoiceStatusTypeEndpoint)
)

export const ContentApiSpecification = Api.make({
  title: 'Content service',
}).pipe(
  Api.addGroup(CmsContentApiGroup),
  Api.addGroup(NewsAndAnnouncementsApiGroup),
  Api.addGroup(DonationsApiGroup)
)
