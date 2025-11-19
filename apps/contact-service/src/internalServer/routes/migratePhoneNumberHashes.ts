import {SqlSchema} from '@effect/sql/index'
import {SqlClient} from '@effect/sql/SqlClient'
import {type SqlError} from '@effect/sql/SqlError'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {type ConfigError} from 'effect/ConfigError'
import {Array, Config, Effect, Option, pipe, Schema} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'
import {ContactRecordId} from '../../db/ContactDbService/domain'
import {UserRecordId} from '../../db/UserDbService/domain'
import {
  ServerHashedNumber,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'

const transformUsersChunk = (
  chunk: ReadonlyArray<{id: UserRecordId; hash: HashedPhoneNumber}>
): Effect.Effect<
  ReadonlyArray<{
    id: UserRecordId
    oldHash: HashedPhoneNumber
    newHash: ServerHashedNumber
  }>,
  CryptoError | ConfigError | UnexpectedServerError
> =>
  pipe(
    chunk,
    Array.map((originalRecord) =>
      pipe(
        serverHashPhoneNumber(originalRecord.hash),
        Effect.map((serverHash) => ({
          id: originalRecord.id,
          newHash: serverHash,
          oldHash: originalRecord.hash,
        }))
      )
    ),
    Effect.allWith({concurrency: 'unbounded'}),
    Effect.withSpan('transformUsersChunk')
  )

const replaceUserHashesInDb =
  (sql: SqlClient) =>
  (
    chunk: ReadonlyArray<{
      oldHash: HashedPhoneNumber
      newHash: ServerHashedNumber
    }>
  ): Effect.Effect<void, SqlError> => {
    if (chunk.length === 0) return Effect.void
    const updateUserHash = sql`
      UPDATE users AS inDb
      SET
        hash = incoming.new_hash
      FROM
        ${sql.updateValues(
        chunk.map((one) => ({old_hash: one.oldHash, new_hash: one.newHash})),
        'incoming'
      )}
      WHERE
        inDb.hash = incoming.old_hash
    `

    const updateHashFrom = sql`
      UPDATE user_contact AS inDb
      SET
        hash_from = incoming.new_hash
      FROM
        ${sql.updateValues(
        chunk.map((one) => ({old_hash: one.oldHash, new_hash: one.newHash})),
        'incoming'
      )}
      WHERE
        inDb.hash_from = incoming.old_hash
    `

    return pipe(
      [updateUserHash, updateHashFrom],
      Effect.allWith({concurrency: 'unbounded'}),
      sql.withTransaction,
      Effect.withSpan('replaceUserHashesInDb')
    )
  }

const migrateUsers = (
  sql: SqlClient
): Effect.Effect<
  void,
  CryptoError | ConfigError | UnexpectedServerError | SqlError | ParseError
> => {
  const getAllContacts = SqlSchema.findAll({
    execute: (req) => sql`
      SELECT
        id,
        hash
      FROM
        users
      WHERE
        id > ${req.lastFetchedId ?? 0}
        AND hash NOT LIKE 'ServerHash:%'
      ORDER BY
        id ASC
      LIMIT
        ${req.limit}
    `,
    Request: Schema.Struct({
      lastFetchedId: Schema.optionalWith(UserRecordId, {
        as: 'Option',
      }),
      limit: Schema.Number,
    }),
    Result: Schema.Struct({
      id: UserRecordId,
      hash: HashedPhoneNumberE,
    }),
  })

  return Effect.gen(function* (_) {
    let lastFetchedId: Option.Option<UserRecordId> = Option.none()
    while (true) {
      yield* _(Effect.logInfo('Fetching next chunk'))
      const chunk = yield* _(
        getAllContacts({
          lastFetchedId,
          limit: 10_000,
        })
      )

      Effect.log(`Got chunk`, Array.take(chunk, 20))

      yield* _(
        Effect.logInfo(
          `Fetched ${chunk.length} records. Running transformation and updating Db`
        )
      )
      yield* _(
        transformUsersChunk(chunk),
        Effect.tap((t) => {
          return Effect.log(`Transformed chunk`, Array.take(t, 20))
        }),
        Effect.flatMap(replaceUserHashesInDb(sql))
      )

      lastFetchedId = pipe(
        Array.last(chunk),
        Option.map((c) => c.id)
      )
      Effect.log('Done processing chunk')
      if (Option.isNone(lastFetchedId)) break
    }
  }).pipe(Effect.withSpan('migrateUsers'))
}

const transformContactsChunks = (
  chunk: ReadonlyArray<{
    id: ContactRecordId
    hashFrom: ServerHashedNumber
    hashTo: HashedPhoneNumber
  }>
): Effect.Effect<
  ReadonlyArray<{
    id: ContactRecordId
    hashFrom: ServerHashedNumber
    hashToOld: HashedPhoneNumber
    hashToNew: ServerHashedNumber
  }>,
  CryptoError | ConfigError | UnexpectedServerError
> =>
  pipe(
    chunk,
    Array.map((originalRecord) =>
      pipe(
        serverHashPhoneNumber(originalRecord.hashTo),
        Effect.map((hashToNew) => ({
          id: originalRecord.id,
          hashFrom: originalRecord.hashFrom,
          hashToOld: originalRecord.hashTo,
          hashToNew,
        }))
      )
    ),
    Effect.allWith({concurrency: 'unbounded'}),
    Effect.withSpan('transformContactsChunk')
  )

const replaceContactHashesInDb =
  (sql: SqlClient) =>
  (
    chunk: ReadonlyArray<{
      id: ContactRecordId
      hashToOld: HashedPhoneNumber
      hashToNew: ServerHashedNumber
    }>
  ): Effect.Effect<void, SqlError> => {
    if (chunk.length === 0) return Effect.void

    return pipe(
      sql`
        UPDATE user_contact AS inDb
        SET
          hash_to = incoming.hash_to_new
        FROM
          ${sql.updateValues(
          chunk.map((one) => ({
            id: one.id,
            hash_to_old: one.hashToOld,
            hash_to_new: one.hashToNew,
          })),
          'incoming'
        )}
        WHERE
          inDb.id = incoming.id
          AND inDb.hash_to = incoming.hash_to_old
      `,
      Effect.withSpan('replaceContactHashesInDb')
    )
  }

const migrateUserContacts = (
  sql: SqlClient
): Effect.Effect<
  void,
  ConfigError | UnexpectedServerError | SqlError | CryptoError | ParseError
> => {
  const fetchUserContactsChunk = SqlSchema.findAll({
    execute: (req) => sql`
      SELECT
        hash_from,
        hash_to,
        id
      FROM
        user_contact
      WHERE
        id > ${req.lastFetchedId ?? 0}
        AND hash_to NOT LIKE 'ServerHash:%'
      ORDER BY
        id ASC
      LIMIT
        ${req.limit}
    `,
    Request: Schema.Struct({
      lastFetchedId: Schema.optionalWith(ContactRecordId, {as: 'Option'}),
      limit: Schema.Number,
    }),
    Result: Schema.Struct({
      id: ContactRecordId,
      hashFrom: ServerHashedNumber,
      hashTo: HashedPhoneNumberE,
    }),
  })
  return Effect.gen(function* (_) {
    let lastFetchedId: Option.Option<ContactRecordId> = Option.none()
    while (true) {
      yield* _(Effect.logInfo('Fetching next chunk'))
      const chunk = yield* _(
        fetchUserContactsChunk({
          lastFetchedId,
          limit: 10_000,
        })
      )

      Effect.log(`Got chunk`, Array.take(chunk, 20))

      yield* _(
        Effect.logInfo(
          `Fetched ${chunk.length} user contacts. Running transformation and updating Db`
        )
      )
      yield* _(
        transformContactsChunks(chunk),
        Effect.tap((t) => {
          return Effect.log(
            `Transformed user contacts chunk`,
            Array.take(t, 20)
          )
        }),
        Effect.flatMap(replaceContactHashesInDb(sql))
      )

      lastFetchedId = pipe(
        Array.last(chunk),
        Option.map((c) => c.id)
      )
      Effect.log('Done processing user contacts chunk')
      if (Option.isNone(lastFetchedId)) {
        break
      }
    }
  }).pipe(Effect.withSpan('migrateContacts'))
}

const migrateLogKeyConfig = Config.string('MIGRATE_LOCK').pipe(
  Config.withDefault('migratePhoneNumberHashes')
)
const enableMigrationConfig = Config.boolean(
  'ENABLE_PHONE_NUMBER_HASH_MIGRATION'
).pipe(Config.withDefault(false))

export const migratePhoneNumberHashes = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient)
  const enableMigration = yield* _(enableMigrationConfig)
  const migrateLockKey = yield* _(migrateLogKeyConfig)

  if (!enableMigration)
    return Effect.log('Migration is disabled via config, skipping.')

  yield* _(
    Effect.gen(function* (_) {
      yield* _(Effect.logInfo('Starting contact DB migration...'))

      // two tables: users(id, hash) and contact
      yield* _(
        Effect.logInfo(
          'First modifying users table and user_contact(hash_from) records!'
        )
      )
      yield* _(migrateUsers(sql))
      yield* _(
        Effect.logInfo(
          'First step done! Now updating user_contact(hash_to) records!'
        )
      )
      yield* _(Effect.logInfo('Modifying user_contact(hash_to) records'))
      yield* _(migrateUserContacts(sql))

      yield* _(Effect.logInfo('Contact DB migration completed'))
    }).pipe(
      withRedisLock(migrateLockKey, '120 minutes'),
      Effect.tapError((e) => {
        console.error(e)
        return Effect.logError(
          `Error during contact DB migration: ${e.message}`
        )
      }),
      Effect.mapError(
        (e) =>
          new UnexpectedServerError({
            cause: e,
            message: 'Error during contact DB migration',
          })
      ),
      Effect.withSpan('migratePhoneNumberHashes')
    )
  )
})
