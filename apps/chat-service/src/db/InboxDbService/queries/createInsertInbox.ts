import {Schema} from '@effect/schema'
import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'

export const InsertInboxParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
})
export type InsertInboxParams = Schema.Schema.Type<typeof InsertInboxParams>

export const createInsertInbox = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('insertInbox', {
      Request: InsertInboxParams,
      execute: (params) => sql`
        INSERT INTO
          inbox ${sql.insert(params)}
      `,
    })
  )

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertInbox', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('insertInbox query')
  )
})
