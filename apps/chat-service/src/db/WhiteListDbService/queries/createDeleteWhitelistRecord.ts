import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {WhitelistRecordId} from '../domain'

export const createDeleteWhitelistRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: WhitelistRecordId,
    execute: (params) => sql`
      DELETE FROM white_list
      WHERE
        id = ${params}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in deleteWhitelistRecord'),
    Effect.withSpan('deleteWhitelistRecord query')
  )
})
