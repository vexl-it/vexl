import {PgClient, PgMigrator} from '@effect/sql-pg'
import {loadMigrationsFromEffect} from '@vexl-next/server-utils/src/loadMigrationsFromEffect'
import {Effect, Layer, String} from 'effect'
import {geocodingDbConfig} from './config'
import initialMigration from './migrations/0001_initial'

const migrations = [
  {
    id: 1,
    name: 'initial',
    migrationEffect: initialMigration,
  },
] as const

export const GeocodingDbSqlLive = geocodingDbConfig.pipe(
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
}).pipe(Layer.provide(GeocodingDbSqlLive))

/** Geocoding DB connection + schema migrations, run on layer build. */
export const GeocodingDbLayer = Layer.mergeAll(GeocodingDbSqlLive, MigratorLive)
