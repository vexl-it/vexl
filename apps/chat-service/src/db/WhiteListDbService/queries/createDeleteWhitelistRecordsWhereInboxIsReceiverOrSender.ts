import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {PublicKeyHashed} from '../../domain'
import {InboxRecordId} from '../../InboxDbService/domain'

const DeleteWhitelistRecordsWhereInboxIsReceiverOrSenderParams = Schema.Struct({
  inboxId: InboxRecordId,
  publicKey: PublicKeyHashed,
})
export type DeleteWhitelistRecordsWhereInboxIsReceiverOrSenderParams =
  Schema.Schema.Type<
    typeof DeleteWhitelistRecordsWhereInboxIsReceiverOrSenderParams
  >

export const createDeleteWhitelistRecordsWhereInboxIsReceiverOrSender =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.void({
      Request: DeleteWhitelistRecordsWhereInboxIsReceiverOrSenderParams,
      execute: (params) => sql`
        DELETE FROM white_list
        WHERE
          inbox_id = ${params.inboxId}
          OR public_key = ${params.publicKey}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in DeleteWhitelistRecordsWhereInboxIsReceiverOrSender',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'DeleteWhitelistRecordsWhereInboxIsReceiverOrSender query'
      )
    )
  })
