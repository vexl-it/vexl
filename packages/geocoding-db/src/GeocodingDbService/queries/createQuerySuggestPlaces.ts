import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {GeocodingRecordWithContext} from '../domain'

const SuggestPlacesRequest = Schema.Struct({
  /** Already normalized (normalizeName) and LIKE-escaped prefix. */
  normPhrase: Schema.String,
  /** Raw normalized phrase for trigram similarity (no LIKE escaping). */
  simPhrase: Schema.String,
  minImportance: Schema.Number,
  usePrefix: Schema.Boolean,
  /**
   * Trigram matching is expensive (GIN scan over the whole names table), so
   * the service only enables it as a typo-tolerant fallback — and only against
   * important places (partial index, importance >= 0.55).
   */
  useTrigram: Schema.Boolean,
  limit: Schema.Int,
})

export const createQuerySuggestPlaces = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: SuggestPlacesRequest,
    Result: GeocodingRecordWithContext,
    execute: (params) => sql`
      WITH
        matches AS (
          SELECT
            place_id,
            1.0::real AS sim,
            importance
          FROM
            place_names
          WHERE
            ${params.usePrefix}
            AND norm_name LIKE ${params.normPhrase + '%'}
            AND importance >= ${params.minImportance}
            -- Rank before capping so a broad prefix drops the least important
            -- matches instead of an arbitrary subset
          ORDER BY
            importance DESC
          LIMIT
            4000
        ),
        trgm_matches AS (
          SELECT
            place_id,
            similarity (norm_name, ${params.simPhrase})::real AS sim,
            importance
          FROM
            place_names
          WHERE
            ${params.useTrigram}
            AND norm_name % ${params.simPhrase}
            AND importance >= 0.55
          ORDER BY
            sim DESC
          LIMIT
            2000
        ),
        -- Rank on the denormalized importance BEFORE joining places, so only
        -- the top rows pay for the join instead of every candidate
        merged AS (
          SELECT
            all_matches.place_id,
            max(all_matches.sim) AS sim,
            max(all_matches.importance) AS importance
          FROM
            (
              SELECT
                *
              FROM
                matches
              UNION ALL
              SELECT
                *
              FROM
                trgm_matches
            ) all_matches
          GROUP BY
            all_matches.place_id
          ORDER BY
            max(all_matches.sim) DESC,
            max(all_matches.importance) DESC
          LIMIT
            ${params.limit}
        ),
        ranked AS (
          SELECT
            p.*,
            merged.sim
          FROM
            merged
            JOIN places p ON p.id = merged.place_id
          ORDER BY
            merged.sim DESC,
            p.importance DESC
          LIMIT
            ${params.limit}
        )
      SELECT
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
      FROM
        ranked r
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
      ORDER BY
        r.sim DESC,
        r.importance DESC
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in querySuggestPlaces', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('querySuggestPlaces query')
  )
})
