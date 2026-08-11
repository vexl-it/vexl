import {Schema} from 'effect'

export const PlaceRecordId = Schema.BigInt.pipe(Schema.brand('PlaceRecordId'))
export type PlaceRecordId = typeof PlaceRecordId.Type

export const PlaceTranslations = Schema.Record({
  key: Schema.String,
  value: Schema.String,
})
export type PlaceTranslations = typeof PlaceTranslations.Type

export class PlaceRecord extends Schema.Class<PlaceRecord>('PlaceRecord')({
  id: PlaceRecordId,
  placeType: Schema.String,
  name: Schema.String,
  names: PlaceTranslations,
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
 * A place enriched with its nearest city/town ("Vinohrady" → "Praha") used to
 * build display labels. cityName/cityNames are None for places that are
 * themselves city-level.
 */
export class PlaceWithContextRecord extends Schema.Class<PlaceWithContextRecord>(
  'PlaceWithContextRecord'
)({
  ...PlaceRecord.fields,
  cityName: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
  cityNames: Schema.optionalWith(PlaceTranslations, {
    as: 'Option',
    nullable: true,
  }),
}) {}
