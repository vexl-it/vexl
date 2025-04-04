import {Api, ApiGroup} from 'effect-http'
import {CommonHeaders} from '../../commonHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  ClearEventsCacheRequest,
  EventsResponse,
  NewsAndAnnouncementsResponse,
} from './contracts'

export const GetEventsEndpoint = Api.get('getEvents', '/content/events').pipe(
  Api.setResponseBody(EventsResponse),
  Api.setResponseStatus(200 as const)
)

export const ClearEventsCacheEndpoint = Api.post(
  'clearEventsCache',
  '/content/events/clear-cache'
).pipe(
  Api.setRequestQuery(ClearEventsCacheRequest),
  Api.setResponseBody(NoContentResponse),
  Api.setResponseStatus(200 as const)
)

export const EventsApiGroup = ApiGroup.make('Events').pipe(
  ApiGroup.addEndpoint(GetEventsEndpoint),
  ApiGroup.addEndpoint(ClearEventsCacheEndpoint)
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

export const ContentApiSpecification = Api.make({
  title: 'Content service',
}).pipe(
  Api.addGroup(EventsApiGroup),
  Api.addGroup(NewsAndAnnouncementsApiGroup)
)
