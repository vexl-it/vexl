import {type PgClient} from '@effect/sql-pg/PgClient'
import {type Fragment} from '@effect/sql/Statement'

export const createIsAllowedSharedContactHashFragment = ({
  hash,
  publicImportCountThreshold,
  sql,
}: {
  hash: Fragment
  publicImportCountThreshold: number
  sql: PgClient
}): Fragment =>
  sql.or([
    sql`${publicImportCountThreshold}::int = -1`,
    sql`
      EXISTS (
        SELECT
          1
        FROM
          users logged_in_shared_contact
        WHERE
          logged_in_shared_contact.hash = ${hash}
      )
    `,
    sql`
      (
        SELECT
          COUNT(*)::int
        FROM
          user_contact shared_contact_imports
        WHERE
          shared_contact_imports.hash_to = ${hash}
      ) <= ${publicImportCountThreshold}::int
    `,
  ])
