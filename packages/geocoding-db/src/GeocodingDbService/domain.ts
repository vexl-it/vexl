import {Effect, Option, Schema} from 'effect'

export const GeocodingRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('GeocodingRecordId')
)
export type GeocodingRecordId = typeof GeocodingRecordId.Type

export const GeocodingTranslations = Schema.Record(Schema.String, Schema.String)
export type GeocodingTranslations = typeof GeocodingTranslations.Type

export class GeocodingRecord extends Schema.Class<GeocodingRecord>(
  'GeocodingRecord'
)({
  id: GeocodingRecordId,
  placeType: Schema.String,
  name: Schema.String,
  names: GeocodingTranslations,
  countryCode: Schema.OptionFromOptionalNullOr(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  population: Schema.OptionFromOptionalNullOr(Schema.BigIntFromString).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  importance: Schema.Number,
  latitude: Schema.Number,
  longitude: Schema.Number,
}) {}

/**
 * A record enriched with its nearest city/town ("Vinohrady" → "Praha") used to
 * build display labels. cityName/cityNames are None for records that are
 * themselves city-level.
 */
export class GeocodingRecordWithContext extends Schema.Class<GeocodingRecordWithContext>(
  'GeocodingRecordWithContext'
)({
  ...GeocodingRecord.fields,
  cityName: Schema.OptionFromOptionalNullOr(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  cityNames: Schema.OptionFromOptionalNullOr(GeocodingTranslations).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
}) {}
