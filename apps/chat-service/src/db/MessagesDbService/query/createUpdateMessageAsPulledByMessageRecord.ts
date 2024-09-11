import {SqlClient, SqlResolver} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {MessageRecordId} from '../domain'

export const createUpdateMessageAsPulledByMessageRecord = Effect.gen(
  function* (_) {
    const sql = yield* _(SqlClient.SqlClient)

    const resolver = yield* _(
      SqlResolver.void('updateMessageAsPulledByInboxId', {
        Request: MessageRecordId,
        execute: (params) => sql`
          UPDATE message
          SET
            pulled = TRUE
          WHERE
            ${sql.in('id', params)}
        `,
      })
    )

    return flow(
      resolver.execute,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in updateMessageAsPulledByInboxId', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('updateMessageAsPulledByInboxId find')
    )
  }
)
