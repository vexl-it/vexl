import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {PublicKeyHashed} from '../../domain'

export const InsertInboxParams = Schema.Struct({
  publicKey: PublicKeyHashed,
  platform: Schema.OptionFromOptional(PlatformName).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  clientVersion: Schema.OptionFromOptional(VersionCode).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type InsertInboxParams = Schema.Schema.Type<typeof InsertInboxParams>

export const createInsertInbox = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const resolver = SqlResolver.void({
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

  return flow(
    SqlResolver.request(resolver),
    UnexpectedServerError.wrapErrors('Error in insertInbox'),
    Effect.withSpan('insertInbox query')
  )
})
