import {Schema} from '@effect/schema'
import {LocationPlaceIdE} from '@vexl-next/domain/src/general/offers'
import {
  LatitudeE,
  LongitudeE,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export class GetLocationSuggestionsRequest extends Schema.Class<GetLocationSuggestionsRequest>(
  'GetLocationSuggestionsRequest'
)({
  // count: Schema.NumberFromString.pipe(
  //   Schema.int(),
  //   Schema.positive(),
  //   Schema.optional({default: () => 10})
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
