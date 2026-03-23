import {type SqlError} from '@effect/sql/SqlError'
import {Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {PgContactClient} from './layer'

const decodeNumberOfUsersResult = Schema.decodeUnknown(
  Schema.NonEmptyArray(
    Schema.Struct({
      count: Schema.compose(Schema.NumberFromString, Schema.Number),
    })
  )
)
export const queryNumberOfUsers: Effect.Effect<
  number,
  SqlError | ParseError,
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
