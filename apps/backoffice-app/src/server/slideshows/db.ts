import {PgClient} from '@effect/sql-pg'
import {Effect, Layer, String} from 'effect'
import {backofficeDatabaseConfig} from './config'

const SqlLive = backofficeDatabaseConfig.pipe(
  Effect.map((config) =>
    PgClient.layer({
      ...config,
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
    })
  ),
  Layer.unwrapEffect
)

export const runDb = <A, E>(
  effect: Effect.Effect<A, E, PgClient.PgClient>
): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(SqlLive)))
