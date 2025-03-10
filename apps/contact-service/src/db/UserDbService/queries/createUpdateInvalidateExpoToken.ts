import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow} from 'effect'

export const createUpdateInvalidateExpoToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('UpdateInvalidateExpoToken', {
      Request: ExpoNotificationTokenE,
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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in invalidateExpoToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('invalidate expo token query')
  )
})
