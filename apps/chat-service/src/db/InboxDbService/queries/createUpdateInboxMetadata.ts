import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api/src/PlatformName'
import {Effect, flow, Schema} from 'effect'
import {InboxRecordId} from '../domain'

const UpdateInboxMetadataParams = Schema.Struct({
  id: InboxRecordId,
  platform: Schema.optionalWith(PlatformName, {as: 'Option'}),
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
})
export type UpdateInboxMetadataParams = Schema.Schema.Type<
  typeof UpdateInboxMetadataParams
>

export const createUpdateInboxMetadata = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateInboxMetadata', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateInboxMetadata query')
  )
})
