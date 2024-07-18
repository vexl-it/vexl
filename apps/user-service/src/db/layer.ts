import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Config, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import addAutoIncrementToFeedbackSubmitMigration from './migrations/0002_add_auto_increment_id_to_feedback_submit_table'

const migrations = [
  {
    id: 1,
    name: 'initial',
    migrationEffect: initialMigraiton,
  },
  {
    id: 2,
    name: 'addAutoIncrementToFeedbackSubmit',
    migrationEffect: addAutoIncrementToFeedbackSubmitMigration,
  },
] as const

const SqlLive = PgClient.layer(
  databaseConfig.pipe(
    Config.map((config) => ({
      ...config,
      transformQueryNames: String.camelToSnake,
    }))
  )
)
const MigratorLive = PgMigrator.layer({
  loader: loadMigrationsFromEffect(migrations),
}).pipe(Layer.provide(SqlLive))

const DbLayer = Layer.mergeAll(SqlLive, MigratorLive)
export default DbLayer
