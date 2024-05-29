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
          public_key AS "publicKey",
          count(user_contact.id) AS "count"
        FROM
          user_contact
          INNER JOIN users ON user_contact.hash_from = users.hash
        WHERE
          user_contact.id <= ${maxId}
          AND user_contact.id > ${someOrZero(minId)}
        GROUP BY
          users.public_key
      `
    ),
    Effect.flatMap(decodePubkeysToConnectionsQueryResult)
  )
