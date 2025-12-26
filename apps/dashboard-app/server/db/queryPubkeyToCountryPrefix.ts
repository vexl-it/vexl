import {type SqlError} from '@effect/sql/SqlError'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect, Option, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {PgUserClient} from './layer'

export const PubKeyToCountryPrefixId = Schema.Number.pipe(
  Schema.brand('PubKeyToCountryPrefixId')
)
export type PubKeyToCountryPrefixId = typeof PubKeyToCountryPrefixId.Type

export class UserRow extends Schema.Class<UserRow>('UserRow')({
  id: Schema.compose(Schema.NumberFromString, PubKeyToCountryPrefixId),
  publicKey: PublicKeyPemBase64,
  countryPrefix: CountryPrefix,
}) {}

const decodeUserRows = Schema.decodeUnknown(Schema.Array(UserRow))

export const queryPubkeyToCountryPrefix = (
  lastId: Option.Option<PubKeyToCountryPrefixId>
): Effect.Effect<readonly UserRow[], ParseError | SqlError, PgUserClient> =>
  PgUserClient.pipe(
    Effect.flatMap(
      (sql) => sql`
        SELECT
          id,
          public_key AS "publicKey",
          country_prefix AS "countryPrefix"
        FROM
          users
        WHERE
          "country_prefix" IS NOT NULL
          AND id > ${Option.getOrElse(lastId, () => 0)}
        ORDER BY
          id ASC
      `
    ),
    Effect.flatMap(decodeUserRows)
  )
