import {type SqlError} from '@effect/sql/SqlError'
import {Effect, Option, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {ContactConnectionId} from './ContactConnectionId'
import {PgContactClient} from './layer'

const decodeNumberOfUsersResult = Schema.decodeUnknown(
  Schema.NonEmptyArray(
    Schema.Struct({
      count: Schema.compose(Schema.NumberFromString, Schema.Number),
      maxId: Schema.OptionFromNullishOr(
        Schema.compose(Schema.NumberFromString, ContactConnectionId),
        undefined
      ),
    })
  )
)
export const queryNumberOfUsers = (
  lastIdFetched: Option.Option<ContactConnectionId>
): Effect.Effect<
  {count: number; maxId: Option.Option<ContactConnectionId>},
  SqlError | ParseError,
  PgContactClient
> =>
  PgContactClient.pipe(
    Effect.flatMap(
      (sql) => sql`
        SELECT
          count(*) AS "count",
          max(a.id) "maxId"
        FROM
          (
            SELECT
              hash_from,
              max(id) AS "id"
            FROM
              user_contact
            WHERE
              id > ${Option.getOrElse(lastIdFetched, () => 0)}
            GROUP BY
              hash_from
          ) a
      `
    ),
    Effect.flatMap(decodeNumberOfUsersResult),
    Effect.map(([first]) => first)
  )
