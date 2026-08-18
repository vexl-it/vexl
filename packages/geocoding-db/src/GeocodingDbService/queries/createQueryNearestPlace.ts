import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {GeocodingRecord, GeocodingTranslations} from '../domain'

const NearestPlaceRequest = Schema.Struct({
  latitude: Schema.Number,
  longitude: Schema.Number,
  /** Results farther than this are treated as "no place here" (ocean pins). */
  maxDistanceMeters: Schema.Number,
})

export class NearestGeocodingRecord extends Schema.Class<NearestGeocodingRecord>(
  'NearestGeocodingRecord'
)({
  ...GeocodingRecord.fields,
  distanceMeters: Schema.Number,
  cityName: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
  cityNames: Schema.optionalWith(GeocodingTranslations, {
    as: 'Option',
    nullable: true,
  }),
}) {}

export const createQueryNearestPlace = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: NearestPlaceRequest,
    Result: NearestGeocodingRecord,
    execute: (params) => sql`
      WITH
        nearest AS (
          SELECT
            p.*,
            earth_distance (
              ll_to_earth (
                ${params.latitude},
                ${params.longitude}
              ),
              ll_to_earth (p.latitude, p.longitude)
            ) AS distance_meters
          FROM
            places p
          WHERE
            -- Reverse geocoding resolves to settlements only — a dropped pin
            -- should read "Vinohrady, Praha", never a street or café name.
            -- Keep in sync with "places_settlement_earth_IX" (migration 0001).
            p.place_type IN (
              'city',
              'town',
              'municipality',
              'borough',
              'village',
              'suburb',
              'quarter',
              'neighbourhood',
              'hamlet',
              'city_block'
            )
          ORDER BY
            ll_to_earth (p.latitude, p.longitude) <-> ll_to_earth (
              ${params.latitude},
              ${params.longitude}
            )
          LIMIT
            1
        )
      SELECT
        n.id,
        n.place_type,
        n.name,
        n.names,
        n.country_code,
        n.population,
        n.importance,
        n.latitude,
        n.longitude,
        n.distance_meters,
        c.name AS city_name,
        c.names AS city_names
      FROM
        nearest n
        LEFT JOIN LATERAL (
          SELECT
            candidates.name,
            candidates.names
          FROM
            (
              SELECT
                city.name,
                city.names,
                city.place_type,
                earth_distance (
                  ll_to_earth (n.latitude, n.longitude),
                  ll_to_earth (city.latitude, city.longitude)
                ) AS city_distance
              FROM
                places city
              WHERE
                n.place_type NOT IN ('city', 'town', 'municipality')
                AND city.place_type IN ('city', 'town')
              ORDER BY
                ll_to_earth (city.latitude, city.longitude) <-> ll_to_earth (n.latitude, n.longitude)
              LIMIT
                24
            ) candidates
          WHERE
            candidates.city_distance <= 30000
          ORDER BY
            CASE
              WHEN candidates.place_type = 'city' THEN 0
              ELSE 1
            END,
            candidates.city_distance ASC
          LIMIT
            1
        ) c ON TRUE
      WHERE
        n.distance_meters <= ${params.maxDistanceMeters}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Geocoding DB nearestPlace query failed'),
    Effect.withSpan('queryNearestPlace query')
  )
})
