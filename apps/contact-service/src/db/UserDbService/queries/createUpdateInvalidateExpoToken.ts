import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'

export const createUpdateInvalidateExpoToken = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const resolver = SqlResolver.void({
    Request: ExpoNotificationToken,
    execute: (params) => sql`
      UPDATE users
      SET
        expo_token = NULL
      WHERE
        ${sql.in('expo_token', params)}
    `,
  })

  return flow(
    SqlResolver.request(resolver),
    UnexpectedServerError.wrapErrors('Error in invalidateExpoToken'),
    Effect.withSpan('invalidate expo token query')
  )
})
