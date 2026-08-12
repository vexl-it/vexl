import {Schema} from 'effect'

export const GeocodingRecordId = Schema.BigInt.pipe(
  Schema.brand('GeocodingRecordId')
)
export type GeocodingRecordId = typeof GeocodingRecordId.Type

export const GeocodingTranslations = Schema.Record({
  key: Schema.String,
  value: Schema.String,
})
export type GeocodingTranslations = typeof GeocodingTranslations.Type

export class GeocodingRecord extends Schema.Class<GeocodingRecord>(
  'GeocodingRecord'
)({
  id: GeocodingRecordId,
  placeType: Schema.String,
  name: Schema.String,
  names: GeocodingTranslations,
  countryCode: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
  population: Schema.optionalWith(Schema.BigInt, {
    as: 'Option',
    nullable: true,
  }),
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
  cityName: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
  cityNames: Schema.optionalWith(GeocodingTranslations, {
    as: 'Option',
    nullable: true,
  }),
}) {}
