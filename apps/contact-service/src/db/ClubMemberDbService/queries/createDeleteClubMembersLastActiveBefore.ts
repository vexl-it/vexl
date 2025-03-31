import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const DeleteClubMembersLastActiveBeforeParams = Schema.Struct({
  lastActiveBefore: Schema.DateFromSelf,
})
export type DeleteClubMembersLastActiveBeforeParams =
  typeof DeleteClubMembersLastActiveBeforeParams.Type

export const createDeleteClubMembersLastActiveBefore = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.void({
      Request: DeleteClubMembersLastActiveBeforeParams,
      execute: (params) => sql`
        DELETE FROM club_member
        WHERE
          last_refreshed_at < ${params.lastActiveBefore}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in deleteClubMemebersLastActiveBefore query',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deleteClubMemebersLastActiveBefore query')
    )
  }
)
