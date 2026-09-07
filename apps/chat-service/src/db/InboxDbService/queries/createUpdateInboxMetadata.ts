import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {InboxRecordId} from '../domain'

const UpdateInboxMetadataParams = Schema.Struct({
  id: InboxRecordId,
  platform: Schema.OptionFromOptional(PlatformName).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  clientVersion: Schema.OptionFromOptional(VersionCode).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type UpdateInboxMetadataParams = typeof UpdateInboxMetadataParams.Type

export const createUpdateInboxMetadata = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: UpdateInboxMetadataParams,
    execute: (params) => sql`
      UPDATE inbox
      SET
        platform = ${params.platform ?? null},
        client_version = ${params.clientVersion ?? null}
      WHERE
        id = ${params.id}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in updateInboxMetadata'),
    Effect.withSpan('updateInboxMetadata query')
  )
})
