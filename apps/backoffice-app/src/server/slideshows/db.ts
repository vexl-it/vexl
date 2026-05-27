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
): Promise<A> => dbRuntime.runPromise(effect)

const dbRuntime = ManagedRuntime.make(SqlLive)

const DatabaseError = Schema.Struct({
  cause: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.String),
  constraint: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
})

const decodeDatabaseError = Schema.decodeUnknownOption(DatabaseError)

export const isDuplicatePublicSlugError = (error: unknown): boolean =>
  pipe(
    decodeDatabaseError(error),
    Option.match({
      onNone: () => false,
      onSome: (databaseError) =>
        databaseError.code === '23505' ||
        databaseError.constraint ===
          'backoffice_tv_slideshows_public_slug_idx' ||
        databaseError.message?.includes('duplicate key') === true ||
        (databaseError.cause !== undefined &&
          isDuplicatePublicSlugError(databaseError.cause)),
    })
  )
