import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Effect, Schema} from 'effect'
import {ContactConnectionId} from './ContactConnectionId'
import {PgContactClient} from './layer'

const decodeMaxContactsQueryResult = Schema.decodeUnknownEffect(
  Schema.NonEmptyArray(
    Schema.Struct({
      max: NumberFromString.pipe(Schema.decodeTo(ContactConnectionId)),
    })
  )
)

export const queryMaxIdConnections = PgContactClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        COALESCE(max(id), 0) AS "max"
      FROM
        user_contact
    `
  ),
  Effect.flatMap(decodeMaxContactsQueryResult),
  Effect.map(([r]) => r.max)
)
