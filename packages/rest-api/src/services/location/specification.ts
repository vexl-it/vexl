import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
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
  '/suggest'
)
  .setUrlParams(GetLocationSuggestionsRequest)
  .addSuccess(GetLocationSuggestionsResponse)
  .addError(LocationNotFoundError)
  .annotate(MaxExpectedDailyCall, 50)

export const GetGeocodedCoordinatesEndpoint = HttpApiEndpoint.get(
  'getGeocodedCoordinates',
  '/geocode'
)
  .setUrlParams(GetGeocodedCoordinatesRequest)
  .addSuccess(GetGeocodedCoordinatesResponse)
  .addError(LocationNotFoundError)
  .annotate(MaxExpectedDailyCall, 50)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(GetLocationSuggestionEndpoint)
  .add(GetGeocodedCoordinatesEndpoint)

export const LocationApiSpecification = HttpApi.make('Location Service')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
