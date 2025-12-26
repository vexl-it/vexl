import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Effect, flow} from 'effect'

export const createUpdateInvalidateFirebaseToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('UpdateInvalidateFirebaseToken', {
      Request: FcmToken,
      execute: (params) => sql`
        UPDATE users
        SET
          firebase_token = NULL
        WHERE
          ${sql.in('firebase_token', params)}
      `,
    })
  )

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in invalidateFirebaseToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('invalidate firebase token query')
  )
})
