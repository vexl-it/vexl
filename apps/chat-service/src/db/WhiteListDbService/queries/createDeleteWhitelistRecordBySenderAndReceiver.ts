import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {PublicKeyHashed} from '../../domain'
import {InboxRecordId} from '../../InboxDbService/domain'

export const DeleteWhitelistRecordBySenderAndReceiverParams = Schema.Struct({
  sender: PublicKeyHashed,
  receiver: InboxRecordId,
})
export type DeleteWhitelistRecordBySenderAndReceiverParams =
  typeof DeleteWhitelistRecordBySenderAndReceiverParams.Type

export const createDeleteWhitelistRecordBySenderAndReceiver = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.void({
      Request: DeleteWhitelistRecordBySenderAndReceiverParams,
      execute: (params) => sql`
        DELETE FROM white_list
        WHERE
          inbox_id = ${params.receiver}
          AND public_key = ${params.sender}
      `,
    })

    return flow(
      query,
      UnexpectedServerError.wrapErrors(
        'Error in deleteWhitelistRecordBySenderAndReceiver'
      ),
      Effect.withSpan('deleteWhitelistRecordBySenderAndReceiver query')
    )
  }
)
