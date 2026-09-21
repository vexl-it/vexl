import {SqlClient, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  MessageRetentionBucket,
  MessageType,
  retentionBucketDays,
} from '@vexl-next/domain/src/general/messaging'
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
  retentionBucket: Schema.optional(MessageRetentionBucket),
})
export type InsertMessageForInboxParams =
  typeof InsertMessageForInboxParams.Type

const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000)

const randomDaysBetween = (lowerLimit: number, upperLimit: number): number =>
  Math.floor(Math.random() * (upperLimit - lowerLimit + 1) + lowerLimit)

export const createInsertMessageForInbox = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const lowerExpirationLimit = yield* _(messageExpirationLowerLimitDaysConfig)
  const upperExpirationLimit = yield* _(messageExpirationUpperLimitDaysConfig)

  const query = SqlSchema.findOne({
    Request: InsertMessageForInboxParams,
    Result: MessageRecord,
    execute: ({retentionBucket, ...params}) => sql`
      INSERT INTO
        message ${sql.insert({
        ...params,
        pulled: false,
        expiresAt: daysFromNow(
          retentionBucket
            ? retentionBucketDays(retentionBucket)
            : randomDaysBetween(lowerExpirationLimit, upperExpirationLimit)
        ),
      })}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.flatten,
    UnexpectedServerError.wrapErrors('Error in insertMessage'),
    Effect.withSpan('insertMessage query')
  )
})
