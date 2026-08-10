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
    UnexpectedServerError.wrapErrors('Error in invalidateFirebaseToken'),
    Effect.withSpan('invalidate firebase token query')
  )
})
