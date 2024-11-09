import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {PublicKeyHashed} from '../../domain'
import {InboxRecordId} from '../../InboxDbService/domain'
import {WhitelistRecord} from '../domain'

export const FindWhitelistRecordBySenderAndReceiverParams = Schema.Struct({
  sender: PublicKeyHashed,
  receiver: InboxRecordId,
})
export type FindWhitelistRecordBySenderAndReceiverParams =
  typeof FindWhitelistRecordBySenderAndReceiverParams.Type

export const createFindWhitelistRecordBySenderAndReceiver = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findOne({
      Request: FindWhitelistRecordBySenderAndReceiverParams,
      Result: WhitelistRecord,
      execute: (params) => sql`
        SELECT
          *
        FROM
          white_list w
        WHERE
          w.inbox_id = ${params.receiver}
          AND w.public_key = ${params.sender}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in findWhitelistRecordBySenderAndReceiver', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findWhitelistRecordBySenderAndReceiver find')
    )
  }
)
