import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow, Option, Schema} from 'effect'

/**
 * The push token of the account that holds `hash`. Only one number of an
 * account has a token, and all of its numbers share the public key.
 */
export const createFindVexlNotificationTokenOfAccountByHash = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findOne({
      Request: ServerHashedNumber,
      Result: Schema.Struct({vexlNotificationToken: VexlNotificationToken}),
      execute: (hash) => sql`
        SELECT
          token_holder.vexl_notification_token
        FROM
          users
          JOIN users token_holder ON token_holder.public_key = users.public_key
        WHERE
          users.hash = ${hash}
          AND token_holder.vexl_notification_token IS NOT NULL
        LIMIT
          1
      `,
    })

    return flow(
      query,
      Effect.map(Option.map((one) => one.vexlNotificationToken)),
      UnexpectedServerError.wrapErrors(
        'Error in findVexlNotificationTokenOfAccountByHash'
      ),
      Effect.withSpan('findVexlNotificationTokenOfAccountByHash query')
    )
  }
)
