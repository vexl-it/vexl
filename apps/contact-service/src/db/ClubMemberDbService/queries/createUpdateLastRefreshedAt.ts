import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubMemberRecord} from '../domain'

export const UpdateLastRefreshedAtParams = Schema.Struct({
  id: ClubRecordId,
  publicKey: PublicKeyPemBase64E,
  lastRefreshedAt: Schema.Date,
})
export type UpdateLastRefreshedAtParams =
  typeof UpdateLastRefreshedAtParams.Type

export const CreateUpdateLastRefreshedAt = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateLastRefreshedAtParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      UPDATE club_member
      SET
        last_refreshed_at = ${params.lastRefreshedAt}
      WHERE
        club_id = ${params.id}
        AND public_key = ${params.publicKey}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in club member updateLastRefreshedAt query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('club member updateLastRefreshedAt query')
  )
})
