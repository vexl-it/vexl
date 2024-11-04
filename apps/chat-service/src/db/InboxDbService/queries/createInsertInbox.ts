import {Schema} from '@effect/schema'
import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api/src/PlatformName'
import {Effect, flow} from 'effect'
import {PublicKeyHashed} from '../../domain'

export const InsertInboxParams = Schema.Struct({
  publicKey: PublicKeyHashed,
  platform: Schema.optionalWith(PlatformName, {as: 'Option'}),
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
})
export type InsertInboxParams = Schema.Schema.Type<typeof InsertInboxParams>

export const createInsertInbox = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('insertInbox', {
      Request: InsertInboxParams,
      execute: (params) => sql`
        INSERT INTO
          inbox ${sql.insert(
          params.map((one) => ({
            ...one,
            platform: one.platform ?? null,
            clientVersion: one.clientVersion ?? null,
          }))
        )}
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
