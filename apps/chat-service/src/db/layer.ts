import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Effect, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import addExpiresAtToMessage from './migrations/0002_add_expires_at_to_messages'
import removeUnusedTables from './migrations/0003_remove_unused_tables'
import dropChallengeTable from './migrations/0004_drop_challenge_table'
import addReceivedByServerAtToMessage from './migrations/0005_add_received_by_server_at_to_message'
import dropInboxTokenColumn from './migrations/0006_drop_inbox_token_column'
import makeReceivedByServerAtNonNullable from './migrations/0007_make_received_by_server_at_non_nullable'
import dropWhiteListTable from './migrations/0008_drop_white_list_table'

const migrations = [
  {
    id: 1,
    name: 'initial',
    migrationEffect: initialMigraiton,
  },
  {
    id: 2,
    name: 'Add expires_at to message',
    migrationEffect: addExpiresAtToMessage,
  },
  {
    id: 3,
    name: 'Remove_unused_tables',
    migrationEffect: removeUnusedTables,
  },
  {
    id: 4,
    name: 'Drop challenge table',
    migrationEffect: dropChallengeTable,
  },
  {
    id: 5,
    name: 'Add received_by_server_at to message',
    migrationEffect: addReceivedByServerAtToMessage,
  },
  {
    id: 6,
    name: 'Drop inbox token column',
    migrationEffect: dropInboxTokenColumn,
  },
  {
    id: 7,
    name: 'Make received_by_server_at non-nullable',
    migrationEffect: makeReceivedByServerAtNonNullable,
  },
  {
    id: 8,
    name: 'Drop white_list table',
    migrationEffect: dropWhiteListTable,
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
