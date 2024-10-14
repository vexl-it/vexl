import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Config, Layer, String} from 'effect'
import {databaseConfig} from '../configs'
import initialMigraiton from './migrations/0001_initial'
import addCreatedAtOnOfferPrivate from './migrations/0003_add_created_at_on_offer_private'
import addIndexOnOfferIdInOfferPrivate from './migrations/000_2_add_index_on_offer_id_in_offer_private'

const migrations = [
  {
    id: 1,
    name: 'initial',
    migrationEffect: initialMigraiton,
  },
  {
    id: 2,
    name: 'Add index on offer id in offer_private',
    migrationEffect: addIndexOnOfferIdInOfferPrivate,
  },

  {
    id: 3,
    name: 'Add index on offer id in offer_private',
    migrationEffect: addCreatedAtOnOfferPrivate,
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
