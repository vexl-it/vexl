import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Array, Effect, flow, Schema} from 'effect'

export const createFindFirebaseTokensOfInactiveUsers = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: Schema.DateFromSelf,
      Result: Schema.Struct({firebaseToken: FcmTokenE}),
      execute: (params) => sql`
        SELECT
          u.firebase_token
        FROM
          users u
        WHERE
          u.refreshed_at IS NOT NULL
          AND u.refreshed_at < ${params}
          AND u.firebase_token IS NOT NULL
      `,
    })

    return flow(
      query,
      Effect.map(Array.map((a) => a.firebaseToken)),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in findFirebaseTokensOfInactiveUsers', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findFirebaseTokensOfInactiveUsers query')
    )
  }
)
