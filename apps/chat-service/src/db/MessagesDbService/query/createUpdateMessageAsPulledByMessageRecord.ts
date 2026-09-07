import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlClient, SqlResolver} from 'effect/unstable/sql'
import {MessageRecordId} from '../domain'

export const createUpdateMessageAsPulledByMessageRecord = Effect.gen(
  function* () {
    const sql = yield* SqlClient.SqlClient

    const resolver = SqlResolver.void({
      Request: MessageRecordId,
      execute: (params) => sql`
        UPDATE message
        SET
          pulled = TRUE
        WHERE
          ${sql.in('id', params)}
      `,
    })

    return flow(
      SqlResolver.request(resolver),
      UnexpectedServerError.wrapErrors(
        'Error in updateMessageAsPulledByInboxId'
      ),
      Effect.withSpan('updateMessageAsPulledByInboxId find')
    )
  }
)
