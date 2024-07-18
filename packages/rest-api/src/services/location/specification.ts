import {Schema} from '@effect/schema'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  GetExchangeRateError,
  GetExchangeRateRequest,
  GetExchangeRateResponse,
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

export const getExchangeRateErrors = Schema.Union(GetExchangeRateError)
export const GetExchangeRateEndpoint = Api.get(
  'getExchangeRate',
  '/btc-rate'
).pipe(
  Api.setRequestQuery(GetExchangeRateRequest),
  Api.setResponseBody(GetExchangeRateResponse),
  Api.setSecurity(ServerSecurity),
  Api.addResponse({
    status: 400 as const,
    body: GetExchangeRateError,
  })
)

export const LocationServiceSpecification = Api.make({
  title: 'Location service',
}).pipe(
  Api.addEndpoint(GetLocationSuggestionEndpoint),
  Api.addEndpoint(GetGeocodedCoordinatesEndpoint),
  Api.addEndpoint(GetExchangeRateEndpoint)
)
