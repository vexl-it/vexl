import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Config, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import addExpiresAtToMessage from './migrations/0002_add_expires_at_to_messages'

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