import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {WhitelistRecordId, WhiteListState} from '../domain'

export const UpdateWhitelistRecordParams = Schema.Struct({
  id: WhitelistRecordId,
  state: WhiteListState,
})

export type UpdateWhitelistRecordParams = Schema.Schema.Type<
  typeof UpdateWhitelistRecordParams
>

export const createUpdateWhitelistRecordState = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateWhitelistRecordParams,
    execute: (params) => sql`
      UPDATE white_list
      SET
        state = ${params.state}
      WHERE
        id = ${params.id}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateWhitelistRecord', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateWhitelistRecord query')
  )
})
