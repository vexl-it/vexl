import {Schema} from '@effect/schema'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  GetExchangeRateRequest,
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

export const GetExchangeRateEndpoint = Api.get('getExchangeRate', '/btc-rate', {
  description: 'Moved to separate service',
}).pipe(
  Api.setRequestQuery(GetExchangeRateRequest),
  Api.setSecurity(ServerSecurity),
  Api.setResponseHeaders(Schema.Struct({Location: Schema.String})),
  Api.setResponseStatus(301 as const)
)

export const LocationApiSpecification = Api.make({
  title: 'Location service',
  version: '1.0.0',
}).pipe(
  Api.addEndpoint(GetLocationSuggestionEndpoint),
  Api.addEndpoint(GetGeocodedCoordinatesEndpoint),
  Api.addEndpoint(GetExchangeRateEndpoint)
)
