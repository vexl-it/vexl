import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Effect, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {type SqlError} from 'effect/unstable/sql/SqlError'
import {PgContactClient} from './layer'

const decodeNumberOfUsersResult = Schema.decodeUnknownEffect(
  Schema.NonEmptyArray(
    Schema.Struct({
      count: NumberFromString.pipe(Schema.decodeTo(Schema.Number)),
    })
  )
)
export const queryNumberOfUsers: Effect.Effect<
  number,
  SqlError | SchemaError,
  PgContactClient
> = PgContactClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        count(*) AS "count"
      FROM
        (
          SELECT
            hash_from
          FROM
            user_contact
          GROUP BY
            hash_from
        ) a
    `
  ),
  Effect.flatMap(decodeNumberOfUsersResult),
  Effect.map(([first]) => first.count)
)
