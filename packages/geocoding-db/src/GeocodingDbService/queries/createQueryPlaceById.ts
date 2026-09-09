import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {GeocodingRecordId, GeocodingRecordWithContext} from '../domain'
import {cityContextJoin, placeWithCityContextColumns} from './cityContext'

export const createQueryPlaceById = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: Schema.Struct({id: GeocodingRecordId}),
    Result: GeocodingRecordWithContext,
    execute: (params) => sql`
      SELECT
        ${placeWithCityContextColumns(sql)}
      FROM
        places r ${cityContextJoin(sql)}
      WHERE
        r.id = ${params.id}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Geocoding DB placeById query failed'),
    Effect.withSpan('queryPlaceById query')
  )
})
