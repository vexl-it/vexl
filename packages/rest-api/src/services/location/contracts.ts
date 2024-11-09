import {CurrencyCodeE} from '@vexl-next/domain/src/general/currency.brand'
import {LocationPlaceIdE} from '@vexl-next/domain/src/general/offers'
import {
  LatitudeE,
  LongitudeE,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Schema} from 'effect'

export class GetLocationSuggestionsRequest extends Schema.Class<GetLocationSuggestionsRequest>(
  'GetLocationSuggestionsRequest'
)({
  // count: Schema.NumberFromString.pipe(
  //   Schema.int(),
  //   Schema.positive(),
  //   Schema.optionalWith({default: () => 10})
  // ),
  phrase: Schema.String,
  lang: Schema.String.pipe(Schema.minLength(2)),
}) {}

export class LocationData extends Schema.Class<LocationData>('LocationData')({
  placeId: LocationPlaceIdE,
  suggestFirstRow: Schema.String,
  suggestSecondRow: Schema.String,
  latitude: LatitudeE,
  longitude: LongitudeE,
  viewport: Schema.Struct({
    northeast: Schema.Struct({
      latitude: LatitudeE,
      longitude: LongitudeE,
    }),
    southwest: Schema.Struct({
      latitude: LatitudeE,
      longitude: LongitudeE,
    }),
  }),
}) {}

export class LocationSuggestion extends Schema.Class<LocationSuggestion>(
  'LocationSuggestion'
)({
  userData: LocationData,
}) {}

export class GetLocationSuggestionsResponse extends Schema.Class<GetLocationSuggestionsResponse>(
  'GetLocationSuggestionsResponse'
)({
  result: Schema.Array(LocationSuggestion),
}) {}

export class GetGeocodedCoordinatesRequest extends Schema.Class<GetGeocodedCoordinatesRequest>(
  'GetGeocodedCoordinatesRequest'
)({
  latitude: Schema.NumberFromString.pipe(Schema.compose(LatitudeE)),
  longitude: Schema.NumberFromString.pipe(Schema.compose(LongitudeE)),
  lang: Schema.String.pipe(Schema.minLength(2)),
}) {}

export class GetGeocodedCoordinatesResponse extends Schema.Class<GetGeocodedCoordinatesResponse>(
  'GetGeocodedCoordinatesResponse'
)({
  placeId: LocationPlaceIdE,
  address: Schema.String,
  latitude: LatitudeE,
  longitude: LongitudeE,
  viewport: Schema.Struct({
    northeast: Schema.Struct({
      latitude: LatitudeE,
      longitude: LongitudeE,
    }),
    southwest: Schema.Struct({
      latitude: LatitudeE,
      longitude: LongitudeE,
    }),
  }),
}) {}

export class LocationNotFoundError extends Schema.TaggedError<LocationNotFoundError>(
  'LocationNotFoundError'
)('LocationNotFoundError', {
  status: Schema.Literal(404),
}) {}

export const GetGeocodedCoordinatesErrors = Schema.Union(LocationNotFoundError)

export class GetExchangeRateRequest extends Schema.Class<GetExchangeRateRequest>(
  'GetExchangeRateRequest'
)({
  currency: Schema.Uppercase.pipe((a) => Schema.compose(a, CurrencyCodeE)),
}) {}
export class GetExchangeRateResponse extends Schema.Class<GetExchangeRateResponse>(
  'GetExchangeRateResponse'
)({
  status: Schema.Literal(301),
  headers: Schema.Struct({Location: Schema.String}),
}) {}

export const GetLocationSuggestionsInput = Schema.Struct({
  query: GetLocationSuggestionsRequest,
})

export type GetLocationSuggestionsInput =
  typeof GetLocationSuggestionsInput.Type

export const GetGeocodedCoordinatesInput = Schema.Struct({
  query: GetGeocodedCoordinatesRequest,
})

export type GetGeocodedCoordinatesInput =
  typeof GetGeocodedCoordinatesInput.Type
