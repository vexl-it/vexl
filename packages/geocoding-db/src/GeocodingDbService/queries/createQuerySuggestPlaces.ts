import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {GeocodingRecordWithContext} from '../domain'
import {cityContextJoin, placeWithCityContextColumns} from './cityContext'

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
        ${placeWithCityContextColumns(sql)}
      FROM
        ranked r ${cityContextJoin(sql)}
      ORDER BY
        r.sim DESC,
        r.importance DESC
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Geocoding DB suggestPlaces query failed'),
    Effect.withSpan('querySuggestPlaces query')
  )
})
