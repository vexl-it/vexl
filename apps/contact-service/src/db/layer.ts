import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Config, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import remove_next_prefix_and_old_users_and_connections from './migrations/0002_remove_next_prefix_and_old_users_and_connections'
import make_version_in_users_table_nullable from './migrations/0003_make_version_in_users_table_nullable'
import add_initial_import_done_column_to_users_table from './migrations/0004_add_initial_import_done_column_to_users_table'
import add_unique_constraint_to_user_contact from './migrations/0004_add_unique_constraint_to_user_contact'

const migrations = [
  {
    id: 1,
    name: 'initial',
    migrationEffect: initialMigraiton,
  },
  {
    id: 2,
    name: 'remove_next_prefix_and_old_users_and_connections',
    migrationEffect: remove_next_prefix_and_old_users_and_connections,
  },
  {
    id: 3,
    name: 'make_version_in_users_table_nullable',
    migrationEffect: make_version_in_users_table_nullable,
  },
  {
    id: 4,
    name: 'add_initial_import_done_column_to_users_table',
    migrationEffect: add_initial_import_done_column_to_users_table,
  },
  {
    id: 5,
    name: 'add_unique_constraint_to_user_contact',
    migrationEffect: add_unique_constraint_to_user_contact,
  },
] as const

const SqlLive = PgClient.layer(
  databaseConfig.pipe(
    Config.map((config) => ({
      ...config,
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
    }))
  )
)
const MigratorLive = PgMigrator.layer({
  loader: loadMigrationsFromEffect(migrations),
}).pipe(Layer.provide(SqlLive))

const DbLayer = Layer.mergeAll(SqlLive, MigratorLive)
export default DbLayer
