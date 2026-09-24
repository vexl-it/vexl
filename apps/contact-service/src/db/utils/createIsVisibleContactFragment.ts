import {type PgClient} from '@effect/sql-pg/PgClient'
import {type Fragment} from '@effect/sql/Statement'

/**
 * Hides users that should not be offered as contacts: users inactive for more
 * than `activeWithinDays` (-1 disables) and, when
 * `hideUsersWithoutPublicKeyV2` is set, users without a V2 public key.
 */
export const createIsVisibleContactFragment = ({
  usersTable,
  activeWithinDays,
  hideUsersWithoutPublicKeyV2,
  sql,
}: {
  usersTable: Fragment
  activeWithinDays: number
  hideUsersWithoutPublicKeyV2: boolean
  sql: PgClient
}): Fragment =>
  sql.and([
    activeWithinDays === -1
      ? sql`TRUE`
      : sql`
          ${usersTable}.refreshed_at >= CURRENT_DATE - ${activeWithinDays}::int
        `,
    hideUsersWithoutPublicKeyV2
      ? sql`${usersTable}.public_key_v2 IS NOT NULL`
      : sql`TRUE`,
  ])
