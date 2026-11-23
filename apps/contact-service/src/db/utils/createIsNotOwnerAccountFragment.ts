import {type PgClient} from '@effect/sql-pg/PgClient'
import {type Fragment} from '@effect/sql/Statement'

/**
 * Excludes every phone number of the account that owns `ownerHash`. One
 * account registers the same public key under each of its numbers.
 */
export const createIsNotOwnerAccountFragment = ({
  usersTable,
  ownerHash,
  sql,
}: {
  usersTable: Fragment
  ownerHash: string
  sql: PgClient
}): Fragment => sql`
  ${usersTable}.public_key IS DISTINCT FROM (
    SELECT
      owner_account.public_key
    FROM
      users owner_account
    WHERE
      owner_account.hash = ${ownerHash}
  )
`
