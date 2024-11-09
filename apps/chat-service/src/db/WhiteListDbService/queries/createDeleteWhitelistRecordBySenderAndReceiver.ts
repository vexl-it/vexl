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
export type DeleteWhitelistRecordBySenderAndReceiverParams = Schema.Schema.Type<
  typeof DeleteWhitelistRecordBySenderAndReceiverParams
>

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
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in deleteWhitelistRecordBySenderAndReceiver',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deleteWhitelistRecordBySenderAndReceiver query')
    )
  }
)
