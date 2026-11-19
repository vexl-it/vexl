import {type PgClient} from '@effect/sql-pg/PgClient'
import {type Fragment} from '@effect/sql/Statement'
import {Array} from 'effect'

/**
 * Decides whether a shared contact hash may connect two users. A hash is
 * allowed if it belongs to a registered user, or if it is neither banned by an
 * admin (see the banned_number table) nor "public" - imported by more than
 * `publicImportCountThreshold` users (typically businesses, service numbers).
 *
 * A threshold of -1 disables the public number filtering, leaving only the
 * ban check.
 */
export const createIsAllowedSharedContactHashFragment = ({
  hashColumn,
  publicImportCountThreshold,
  sql,
}: {
  hashColumn: Fragment
  publicImportCountThreshold: number
  sql: PgClient
}): Fragment => {
  const isNotBanned = sql`
    NOT EXISTS (
      SELECT
        1
      FROM
        banned_number
      WHERE
        banned_number.hash = ${hashColumn}
    )
  `
  const isRegisteredUser = sql`
    EXISTS (
      SELECT
        1
      FROM
        users logged_in_shared_contact
      WHERE
        logged_in_shared_contact.hash = ${hashColumn}
    )
  `

  if (publicImportCountThreshold === -1)
    return sql.or([isNotBanned, isRegisteredUser])

  return sql.or([
    isRegisteredUser,
    sql.and([
      isNotBanned,
      // LIMIT caps the scan - we only need to know whether the number of
      // imports exceeds the threshold, never the exact count, which can be
      // huge for exactly the public numbers this filter targets.
      sql`
        (
          SELECT
            COUNT(*)
          FROM
            (
              SELECT
                1
              FROM
                user_contact shared_contact_imports
              WHERE
                shared_contact_imports.hash_to = ${hashColumn}
              LIMIT
                ${publicImportCountThreshold + 1}
            ) capped_shared_contact_imports
        ) <= ${publicImportCountThreshold}::int
      `,
    ]),
  ])
}

/**
 * Same filtering as createIsAllowedSharedContactHashFragment, but for checking
 * a column against a list of hashes passed as a query parameter. Filtering the
 * short list before it's joined against the contact graph is much cheaper than
 * re-evaluating the same hashes on every joined row - correlated subqueries
 * are not memoized, and a single popular hash can join to thousands of rows.
 */
export const createIsInAllowedSharedContactHashesFragment = ({
  hashColumn,
  hashes,
  publicImportCountThreshold,
  sql,
}: {
  hashColumn: Fragment
  hashes: readonly string[]
  publicImportCountThreshold: number
  sql: PgClient
}): Fragment => {
  if (!Array.isNonEmptyReadonlyArray(hashes)) return sql`1 = 0`

  return sql`
    ${hashColumn} IN (
      SELECT
        allowed.hash
      FROM
        unnest(
          ARRAY[${sql.csv(
      Array.map(hashes, (hash) => sql`${hash}`)
    )}]::VARCHAR[]
        ) AS allowed (hash)
      WHERE
        ${createIsAllowedSharedContactHashFragment({
      hashColumn: sql`allowed.hash`,
      publicImportCountThreshold,
      sql,
    })}
    )
  `
}
