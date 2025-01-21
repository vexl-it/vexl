import {Api, ApiGroup} from 'effect-http'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {ClearEventsCacheRequest, EventsResponse} from './contracts'

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

export const ContentApiSpecification = Api.make({
  title: 'Content service',
}).pipe(Api.addGroup(EventsApiGroup))
