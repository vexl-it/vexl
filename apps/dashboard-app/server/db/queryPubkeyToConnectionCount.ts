import {Schema} from '@effect/schema'
import {type ParseError} from '@effect/schema/ParseResult'
import {type SqlError} from '@effect/sql/Error'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Effect, Option} from 'effect'
import {type ContactConnectionId} from './ContactConnectionId'
import {PgContactClient} from './layer'

const PubKeyToConnectionsRow = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  count: Schema.NumberFromString,
})
export type PubKeyToConnectionsRow = Schema.Schema.Type<
  typeof PubKeyToConnectionsRow
>

const decodePubkeysToConnectionsQueryResult = Schema.decodeUnknown(
  Schema.Array(PubKeyToConnectionsRow)
)

const someOrZero = <T>(o: Option.Option<T>): T | 0 =>
  Option.getOrElse(o, () => 0)

export const queryPubkeysToConnections = ({
  minId,
  maxId,
}: {
  minId: Option.Option<ContactConnectionId>
  maxId: ContactConnectionId
}): Effect.Effect<
  readonly PubKeyToConnectionsRow[],
  SqlError | ParseError,
  PgContactClient
> =>
  PgContactClient.pipe(
    Effect.flatMap(
      (sql) => sql`
        SELECT
          users.public_key AS "publicKey",
          count(DISTINCT lvl1Users.id) + count(DISTINCT lvl2Users.id) AS "count"
        FROM
          users
          LEFT JOIN user_contact lvl1 ON lvl1.hash_from = users.hash
          AND lvl1.id > ${someOrZero(minId)}
          AND lvl1.id <= ${maxId}
          LEFT JOIN users lvl1users ON concat('next:', lvl1.hash_to) = lvl1users.hash
          LEFT JOIN user_contact lvl2 ON lvl1.hash_to = lvl2.hash_to
          AND lvl2.hash_from != users.hash
          LEFT JOIN users lvl2Users ON lvl2.hash_from = lvl2Users.hash
        GROUP BY
          users.public_key
        HAVING
          count(DISTINCT lvl1Users.id) + count(DISTINCT lvl2Users.id) > 0
      `
    ),
    Effect.flatMap(decodePubkeysToConnectionsQueryResult)
  )
