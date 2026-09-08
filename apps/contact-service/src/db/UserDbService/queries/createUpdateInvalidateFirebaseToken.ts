import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'

export const createUpdateInvalidateFirebaseToken = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const resolver = SqlResolver.void({
    Request: FcmToken,
    execute: (params) => sql`
      UPDATE users
      SET
        firebase_token = NULL
      WHERE
        ${sql.in('firebase_token', params)}
    `,
  })

  return flow(
    SqlResolver.request(resolver),
    UnexpectedServerError.wrapErrors('Error in invalidateFirebaseToken'),
    Effect.withSpan('invalidate firebase token query')
  )
})
