import {type SqlClient, type SqlError} from '@effect/sql'
import {type Loader, type ResolvedMigration} from '@effect/sql/Migrator'
import {Array, Effect, Order, pipe} from 'effect'

export const loadMigrationsFromEffect = (
  migrations: ReadonlyArray<{
    name: string
    id: number
    migrationEffect: Effect.Effect<
      unknown,
      SqlError.SqlError,
      SqlClient.SqlClient
    >
  }>
): Loader<never> =>
  Effect.succeed<readonly ResolvedMigration[]>(
    pipe(
      migrations,
      Array.map(
        ({name, id, migrationEffect}) =>
          [id, name, Effect.succeed<any>({default: migrationEffect})] as const
      ),
      Array.sortWith((a) => a[0], Order.number)
    )
  )
