import {type SqlError} from '@effect/sql/SqlError'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Effect, Option, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {type ContactConnectionId} from './ContactConnectionId'
import {PgContactClient} from './layer'

const PubKeyToConnectionsRow = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  count: Schema.NumberFromString,
})
export type PubKeyToConnectionsRow = typeof PubKeyToConnectionsRow.Type

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
    Effect.flatMap((sql) =>
      sql.withTransaction(
        sql`
          SET
            LOCAL statement_timeout = '5min'
        `.pipe(
          Effect.zipRight(sql`
            WITH
              new_contacts AS (
                SELECT
                  hash_from,
                  hash_to
                FROM
                  user_contact
                WHERE
                  id > ${someOrZero(minId)}
                  AND id <= ${maxId}
              ),
              lvl1 AS (
                SELECT
                  new_contacts.hash_from,
                  count(*) AS "count"
                FROM
                  new_contacts
                  JOIN users ON users.hash = new_contacts.hash_to
                GROUP BY
                  new_contacts.hash_from
              ),
              lvl2_pairs AS (
                SELECT DISTINCT
                  new_contacts.hash_from,
                  other.hash_from AS other_hash
                FROM
                  new_contacts
                  JOIN user_contact other ON other.hash_to = new_contacts.hash_to
                  AND other.hash_from <> new_contacts.hash_from
              ),
              lvl2 AS (
                SELECT
                  lvl2_pairs.hash_from,
                  count(*) AS "count"
                FROM
                  lvl2_pairs
                  JOIN users ON users.hash = lvl2_pairs.other_hash
                GROUP BY
                  lvl2_pairs.hash_from
              )
            SELECT
              users.public_key AS "publicKey",
              coalesce(lvl1.count, 0) + coalesce(lvl2.count, 0) AS "count"
            FROM
              users
              LEFT JOIN lvl1 ON lvl1.hash_from = users.hash
              LEFT JOIN lvl2 ON lvl2.hash_from = users.hash
            WHERE
              coalesce(lvl1.count, 0) + coalesce(lvl2.count, 0) > 0
          `)
        )
      )
    ),
    Effect.flatMap(decodePubkeysToConnectionsQueryResult)
  )
