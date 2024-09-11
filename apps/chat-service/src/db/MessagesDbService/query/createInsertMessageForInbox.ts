import {Schema} from '@effect/schema'
import {SqlClient, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {MessageTypeE} from '@vexl-next/domain/src/general/messaging'
import {Effect, flow} from 'effect'
import {PublicKeyEncrypted} from '../../domain'
import {InboxRecordId} from '../../InboxDbService/domain'
import {MessageRecord} from '../domain'

export const InsertMessageForInboxParams = Schema.Struct({
  message: Schema.String,
  senderPublicKey: PublicKeyEncrypted,
  type: MessageTypeE,
  inboxId: InboxRecordId,
})
export type InsertMessageForInboxParams = Schema.Schema.Type<
  typeof InsertMessageForInboxParams
>

export const createInsertMessageForInbox = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const query = SqlSchema.findOne({
    Request: InsertMessageForInboxParams,
    Result: MessageRecord,
    execute: (params) => sql`
      INSERT INTO
        message ${sql.insert({
        ...params,
        pulled: false,
      })}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.flatten,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertMessage', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('insertMessage query')
  )
})
