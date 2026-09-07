import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {MessageType} from '@vexl-next/domain/src/general/messaging'
import {Effect, Schema, flow} from 'effect'
import {SqlClient, SqlSchema} from 'effect/unstable/sql'
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

export const createInsertMessageForInbox = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const lowerExpirationLimit = yield* messageExpirationLowerLimitDaysConfig
  const upperExpirationLimit = yield* messageExpirationUpperLimitDaysConfig

  const query = SqlSchema.findOneOption({
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
    Effect.flatMap(Effect.fromOption),
    UnexpectedServerError.wrapErrors('Error in insertMessage'),
    Effect.withSpan('insertMessage query')
  )
})
