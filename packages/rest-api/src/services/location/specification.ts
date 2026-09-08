import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from 'effect/unstable/httpapi'
import {commonApiErrors} from '../../commonApiErrors'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  GetGeocodedCoordinatesRequest,
  GetGeocodedCoordinatesResponse,
  GetLocationSuggestionsRequest,
  GetLocationSuggestionsResponse,
  LocationNotFoundError,
} from './contracts'

export const GetLocationSuggestionEndpoint = HttpApiEndpoint.get(
  'getLocationSuggestion',
  '/suggest',
  {
    disableCodecs: true,
    query: GetLocationSuggestionsRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      LocationNotFoundError.pipe(HttpApiSchema.status(404)),
    ]),
    success: Schema.Struct(GetLocationSuggestionsResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 50)

export const GetGeocodedCoordinatesEndpoint = HttpApiEndpoint.get(
  'getGeocodedCoordinates',
  '/geocode',
  {
    disableCodecs: true,
    query: GetGeocodedCoordinatesRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      LocationNotFoundError.pipe(HttpApiSchema.status(404)),
    ]),
    success: Schema.Struct(GetGeocodedCoordinatesResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 50)

export const GetLocationSuggestionV2Endpoint = HttpApiEndpoint.get(
  'getLocationSuggestionV2',
  '/api/v2/suggest',
  {
    disableCodecs: true,
    query: GetLocationSuggestionsRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      LocationNotFoundError.pipe(HttpApiSchema.status(404)),
    ]),
    success: Schema.Struct(GetLocationSuggestionsResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 50)

export const GetGeocodedCoordinatesV2Endpoint = HttpApiEndpoint.get(
  'getGeocodedCoordinatesV2',
  '/api/v2/geocode',
  {
    disableCodecs: true,
    query: GetGeocodedCoordinatesRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      LocationNotFoundError.pipe(HttpApiSchema.status(404)),
    ]),
    success: Schema.Struct(GetGeocodedCoordinatesResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 50)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(GetLocationSuggestionEndpoint)
  .add(GetGeocodedCoordinatesEndpoint)
  .add(GetLocationSuggestionV2Endpoint)
  .add(GetGeocodedCoordinatesV2Endpoint)

export const LocationApiSpecification = HttpApi.make('Location Service')
  .add(RootGroup)
  .middleware(RateLimitingMiddleware)
