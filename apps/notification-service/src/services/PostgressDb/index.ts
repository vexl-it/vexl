import {PgClient, PgMigrator} from '@effect/sql-pg'
import {databaseConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Effect, Layer, String} from 'effect/index'
import {createNotificationTokens} from './migrations/001_createNotificationTokens'

const migrations = [
  {
    id: 1,
    name: 'create_notification_tokens',
    migrationEffect: createNotificationTokens,
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

export const PosgressDbLive = Layer.mergeAll(SqlLive, MigratorLive)
