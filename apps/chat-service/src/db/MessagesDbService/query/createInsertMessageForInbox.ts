import {SqlClient, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {MessageType} from '@vexl-next/domain/src/general/messaging'
import {Effect, Schema, flow} from 'effect'
import {
  messageExpirationLowerLimitDaysConfig,
  messageExpirationUpperLimitDaysConfig,
} from '../../../configs'
import {InboxRecordId} from '../../InboxDbService/domain'
import {PublicKeyEncrypted} from '../../domain'
import {MessageRecord} from '../domain'

export const InsertMessageForInboxParams = Schema.Struct({
  message: Schema.String,
  senderPublicKey: PublicKeyEncrypted,
  type: MessageType,
  inboxId: InboxRecordId,
})
export type InsertMessageForInboxParams =
  typeof InsertMessageForInboxParams.Type

const generateExpiresAt = (lowerLimit: number, upperLimit: number): Date => {
  const toExpireAfterDays = Math.floor(
    Math.random() * (upperLimit - lowerLimit + 1) + lowerLimit
  )

  return new Date(Date.now() + toExpireAfterDays * 24 * 60 * 60 * 1000)
}

export const createInsertMessageForInbox = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const lowerExpirationLimit = yield* _(messageExpirationLowerLimitDaysConfig)
  const upperExpirationLimit = yield* _(messageExpirationUpperLimitDaysConfig)

  const query = SqlSchema.findOne({
    Request: InsertMessageForInboxParams,
    Result: MessageRecord,
    execute: (params) => sql`
      INSERT INTO
        message ${sql.insert({
        ...params,
        pulled: false,
        expiresAt: generateExpiresAt(
          lowerExpirationLimit,
          upperExpirationLimit
        ),
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
