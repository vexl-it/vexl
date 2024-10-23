import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {PublicKeyHashed} from '../../domain'
import {InboxRecordId} from '../../InboxDbService/domain'
import {WhiteListState} from '../domain'

export const InsertWhitelistRecordParams = Schema.Struct({
  sender: PublicKeyHashed,
  receiver: InboxRecordId,
  state: WhiteListState,
})

export type InsertWhitelistRecordParams = Schema.Schema.Type<
  typeof InsertWhitelistRecordParams
>

export const createInsertWhitelistRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertWhitelistRecordParams,
    execute: (params) => sql`
      INSERT INTO
        white_list ${sql.insert({
        inboxId: params.receiver,
        publicKey: params.sender,
        state: params.state,
        date: new Date(),
      })}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertWhitelistRecord', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('insertWhitelistRecord query')
  )
})
