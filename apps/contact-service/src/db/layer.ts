import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Effect, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import remove_next_prefix_and_old_users_and_connections from './migrations/0002_remove_next_prefix_and_old_users_and_connections'
import make_version_in_users_table_nullable from './migrations/0003_make_version_in_users_table_nullable'
import add_initial_import_done_column_to_users_table from './migrations/0004_add_initial_import_done_column_to_users_table'
import add_unique_constraint_to_user_contact from './migrations/0004_add_unique_constraint_to_user_contact'
import add_country_prefix_to_users_table from './migrations/0005_add_country_prefix_to_users_table'
import add_table_for_clubs from './migrations/0006_add_table_for_clubs'
import add_expo_token_to_users_table from './migrations/0007_add_expo_token_to_users_table'
import add_table_for_challenges from './migrations/0008_add_table_for_challenges'
import club_member_rename_last_refreshed_at_to_timestamp from './migrations/0009_club_member_rename_last_refreshed_at_to_timestamp'
import add_club_column_inactive_and_to_be_deleted from './migrations/0010_add_club_column_inactive_and_to_be_deleted'
import add_club_column_report from './migrations/0011_add_club_column_report'
import create_club_offer_reported_by_user_table_and_add_index from './migrations/0012_create_club_offer_reported_by_user_table_and_add_index'
import add_club_column_report_limit from './migrations/0013_add_club_column_report_limit'

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
  {
    id: 6,
    name: 'add_country_prefix_to_users_table',
    migrationEffect: add_country_prefix_to_users_table,
  },
  {
    id: 7,
    name: 'add_table_for_clubs',
    migrationEffect: add_table_for_clubs,
  },
  {
    id: 8,
    name: 'add_expo_token_to_users_table',
    migrationEffect: add_expo_token_to_users_table,
  },
  {
    id: 9,
    name: 'add_table_for_challenges',
    migrationEffect: add_table_for_challenges,
  },
  {
    id: 10,
    name: 'club_member_rename_last_refreshed_at_to_timestamp',
    migrationEffect: club_member_rename_last_refreshed_at_to_timestamp,
  },
  {
    id: 11,
    name: 'add_club_column_inactive_and_to_be_deleted',
    migrationEffect: add_club_column_inactive_and_to_be_deleted,
  },
  {
    id: 12,
    name: 'add_club_column_report',
    migrationEffect: add_club_column_report,
  },
  {
    id: 13,
    name: 'create_club_offer_reported_by_user_table_and_add_index',
    migrationEffect: create_club_offer_reported_by_user_table_and_add_index,
  },
  {
    id: 14,
    name: 'add_club_column_report_limit',
    migrationEffect: add_club_column_report_limit,
  },
] as const

const SqlLive = databaseConfig.pipe(
  Effect.map((config) =>
    PgClient.layer({
      ...config,
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
    })
  ),
  Layer.unwrapEffect
)
const MigratorLive = PgMigrator.layer({
  loader: loadMigrationsFromEffect(migrations),
}).pipe(Layer.provide(SqlLive))

const DbLayer = Layer.mergeAll(SqlLive, MigratorLive)
export default DbLayer
