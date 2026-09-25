import {PgClient} from '@effect/sql-pg'
import {
  Effect,
  Layer,
  ManagedRuntime,
  Option,
  pipe,
  Schema,
  String,
} from 'effect'
import {backofficeDatabaseConfig, metricsDatabaseConfig} from './config'

const makeSqlRuntime = (
  config: typeof backofficeDatabaseConfig
): ManagedRuntime.ManagedRuntime<PgClient.PgClient, unknown> =>
  ManagedRuntime.make(
    config.pipe(
      Effect.map((databaseConfig) =>
        PgClient.layer({
          ...databaseConfig,
          transformQueryNames: String.camelToSnake,
          transformResultNames: String.snakeToCamel,
        })
      ),
      Layer.unwrapEffect
    )
  )

const dbRuntime = makeSqlRuntime(backofficeDatabaseConfig)
const metricsDbRuntime = makeSqlRuntime(metricsDatabaseConfig)

export const runDb = <A, E>(
  effect: Effect.Effect<A, E, PgClient.PgClient>
): Promise<A> => dbRuntime.runPromise(effect)

export const runMetricsDb = <A, E>(
  effect: Effect.Effect<A, E, PgClient.PgClient>
): Promise<A> => metricsDbRuntime.runPromise(effect)

const DatabaseError = Schema.Struct({
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
})

const decodeDatabaseError = Schema.decodeUnknownOption(DatabaseError)

export const isUniqueViolationError = (error: unknown): boolean =>
  pipe(
    decodeDatabaseError(error),
    Option.match({
      onNone: () => false,
      onSome: (databaseError) =>
        databaseError.code === '23505' ||
        databaseError.message?.includes('duplicate key') === true ||
        (databaseError.cause !== undefined &&
          isUniqueViolationError(databaseError.cause)),
    })
  )
