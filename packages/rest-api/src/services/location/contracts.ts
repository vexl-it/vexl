import {LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
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
  placeId: LocationPlaceId,
  suggestFirstRow: Schema.String,
  suggestSecondRow: Schema.String,
  latitude: Latitude,
  longitude: Longitude,
  viewport: Schema.Struct({
    northeast: Schema.Struct({
      latitude: Latitude,
      longitude: Longitude,
    }),
    southwest: Schema.Struct({
      latitude: Latitude,
      longitude: Longitude,
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
  latitude: Schema.NumberFromString.pipe(Schema.compose(Latitude)),
  longitude: Schema.NumberFromString.pipe(Schema.compose(Longitude)),
  lang: Schema.String.pipe(Schema.minLength(2)),
}) {}

export class GetGeocodedCoordinatesResponse extends Schema.Class<GetGeocodedCoordinatesResponse>(
  'GetGeocodedCoordinatesResponse'
)({
  placeId: LocationPlaceId,
  address: Schema.String,
  latitude: Latitude,
  longitude: Longitude,
  viewport: Schema.Struct({
    northeast: Schema.Struct({
      latitude: Latitude,
      longitude: Longitude,
    }),
    southwest: Schema.Struct({
      latitude: Latitude,
      longitude: Longitude,
    }),
  }),
}) {}

export class LocationNotFoundError extends Schema.TaggedError<LocationNotFoundError>(
  'LocationNotFoundError'
)('LocationNotFoundError', {
  status: Schema.Literal(404),
}) {}
