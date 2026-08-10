import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow} from 'effect'

export const createUpdateInvalidateExpoToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('UpdateInvalidateExpoToken', {
      Request: ExpoNotificationToken,
      execute: (params) => sql`
        UPDATE users
        SET
          expo_token = NULL
        WHERE
          ${sql.in('expo_token', params)}
      `,
    })
  )

  return flow(
    resolver.execute,
    UnexpectedServerError.wrapErrors('Error in invalidateExpoToken'),
    Effect.withSpan('invalidate expo token query')
  )
})
