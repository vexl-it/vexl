import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  BannedNumberAdminInfo,
  BannedNumberId,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, flow, Schema} from 'effect'

export const ListBannedNumbersParams = Schema.Struct({
  search: Schema.String,
  beforeId: Schema.optional(BannedNumberId),
  limit: Schema.Int,
})
export type ListBannedNumbersParams = typeof ListBannedNumbersParams.Type

export const BannedNumberListItem = Schema.Struct({
  ...BannedNumberAdminInfo.fields,
  createdAt: Schema.DateFromSelf,
})
export type BannedNumberListItem = typeof BannedNumberListItem.Type

export const createListBannedNumbers = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: ListBannedNumbersParams,
    Result: BannedNumberListItem,
    execute: (params) => sql`
      SELECT
        id,
        phone_number,
        note,
        created_at
      FROM
        banned_number
      WHERE
        ${sql.and([
        sql`strpos(phone_number, ${params.search}) > 0`,
        params.beforeId === undefined
          ? sql`TRUE`
          : sql`id < ${params.beforeId}`,
      ])}
      ORDER BY
        id DESC
      LIMIT
        ${params.limit}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in listBannedNumbers query'),
    Effect.withSpan('listBannedNumbers query')
  )
})
