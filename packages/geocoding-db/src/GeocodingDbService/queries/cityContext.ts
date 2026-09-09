import {type Statement} from '@effect/sql'
import {type PgClient} from '@effect/sql-pg'

/**
 * Column list of a `GeocodingRecordWithContext` row for a place aliased `r`
 * joined with `cityContextJoin`.
 */
export const placeWithCityContextColumns = (
  sql: PgClient.PgClient
): Statement.Fragment => sql`
  r.id,
  r.place_type,
  r.name,
  r.names,
  r.country_code,
  r.population,
  r.importance,
  r.latitude,
  r.longitude,
  c.name AS city_name,
  c.names AS city_names
`

/**
 * Attaches the nearest city/town within 30 km (preferring cities) as `c` to
 * a sub-city place aliased `r`; city-level places get no context.
 */
export const cityContextJoin = (
  sql: PgClient.PgClient
): Statement.Fragment => sql`
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
            ll_to_earth (r.latitude, r.longitude),
            ll_to_earth (city.latitude, city.longitude)
          ) AS city_distance
        FROM
          places city
        WHERE
          r.place_type NOT IN ('city', 'town', 'municipality')
          AND city.place_type IN ('city', 'town')
        ORDER BY
          ll_to_earth (city.latitude, city.longitude) <-> ll_to_earth (r.latitude, r.longitude)
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
`
