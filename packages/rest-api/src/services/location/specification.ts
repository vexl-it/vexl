import {Schema} from '@effect/schema'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  GetGeocodedCoordinatesRequest,
  GetGeocodedCoordinatesResponse,
  GetLocationSuggestionsRequest,
  GetLocationSuggestionsResponse,
  LocationNotFoundError,
} from './contracts'

export const getLocationSuggestionErrors = Schema.Union(LocationNotFoundError)
export const GetLocationSuggestionEndpoint = Api.get(
  'getLocationSuggestion',
  '/suggest'
).pipe(
  Api.setRequestQuery(GetLocationSuggestionsRequest),
  Api.setResponseBody(GetLocationSuggestionsResponse),
  Api.setSecurity(ServerSecurity),
  Api.addResponse({
    status: 404 as const,
    body: LocationNotFoundError,
  })
)

export const GetGeocodedCoordinatesErrors = Schema.Union(LocationNotFoundError)
export const GetGeocodedCoordinatesEndpoint = Api.get(
  'getGeocodedCoordinates',
  '/geocode'
).pipe(
  Api.setRequestQuery(GetGeocodedCoordinatesRequest),
  Api.setResponseBody(GetGeocodedCoordinatesResponse),
  Api.setSecurity(ServerSecurity),
  Api.addResponse({
    status: 404 as const,
    body: LocationNotFoundError,
  })
)

export const LocationServiceSpecification = Api.make({
  title: 'Location service',
}).pipe(
  Api.addEndpoint(GetLocationSuggestionEndpoint),
  Api.addEndpoint(GetGeocodedCoordinatesEndpoint)
)
