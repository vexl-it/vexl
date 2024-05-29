import {Schema} from '@effect/schema'
import {type ParseError} from '@effect/schema/ParseResult'
import {type SqlError} from '@effect/sql/Error'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect, Option} from 'effect'
import {PgUserClient} from './layer'

export const PubKeyToCountryPrefixId = Schema.Number.pipe(
  Schema.brand('PubKeyToCountryPrefixId')
)
export type PubKeyToCountryPrefixId = Schema.Schema.Type<
  typeof PubKeyToCountryPrefixId
>

export class UserRow extends Schema.Class<UserRow>('UserRow')({
  id: Schema.compose(Schema.NumberFromString, PubKeyToCountryPrefixId),
  publicKey: PublicKeyPemBase64E,
  countryPrefix: CountryPrefixE,
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
