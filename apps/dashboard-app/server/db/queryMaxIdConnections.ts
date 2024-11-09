import {Effect, Schema} from 'effect'
import {ContactConnectionId} from './ContactConnectionId'
import {PgContactClient} from './layer'

const decodeMaxContactsQueryResult = Schema.decodeUnknown(
  Schema.NonEmptyArray(
    Schema.Struct({
      max: Schema.compose(Schema.NumberFromString, ContactConnectionId),
    })
  )
)

export const queryMaxIdConnections = PgContactClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        max(id) AS "max"
      FROM
        user_contact
    `
  ),
  Effect.flatMap(decodeMaxContactsQueryResult),
  Effect.map(([r]) => r.max)
)
