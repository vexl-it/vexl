import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Effect, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import fixBadAttributesFormat from './migrations/0002_fix_bad_attributes_format'
import addLastReportedByServiceTable from './migrations/0003_add_last_reported_by_service_table'

const migrations = [
  {
    id: 1,
    name: 'initial',
    migrationEffect: initialMigraiton,
  },
  {
    id: 2,
    name: 'fix bad attributes format',
    migrationEffect: fixBadAttributesFormat,
  },
  {
    id: 3,
    name: 'add_last_reported_by_service_table',
    migrationEffect: addLastReportedByServiceTable,
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
