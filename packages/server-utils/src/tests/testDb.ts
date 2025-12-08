import {PgClient} from '@effect/sql-pg'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Config, Console, Effect, Layer, Option, Redacted} from 'effect'

const testDbConfig = Config.unwrap({
  host: Config.withDefault(Config.string('TEST_DB_HOST'), 'localhost'),
  port: Config.number('TEST_DB_PORT'),
  username: Config.string('TEST_DB_USER'),
  password: Config.redacted('TEST_DB_PASSWORD'),
  database: Config.succeed('postgres'),
  forceName: Config.option(Config.string('TEST_DB_FORCE_NAME')),
  debug: Config.succeed(true),
})
const keepDbConfig = Config.boolean('TEST_KEEP_DB').pipe(
  Config.withDefault(false)
)

const testServicePgClient = testDbConfig.pipe(
  Effect.map((config) =>
    PgClient.layer({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      // debug: config.debug,
    })
  ),
  Layer.unwrapEffect,
  Layer.tapError((e) =>
    Effect.flatMap(testDbConfig, (config) =>
      Effect.logInfo('Failed to connect the test database', config, e)
    )
  )
)

// I know, this is not pretty, but we are doing this for tests so it's fine...
// If you the reader feel like this is not fine, create a context and a layer that
// holds Ref of tableName and pass it around... But it seems like it does not add anything
// I am also lazy and since this is not running in production nor in a real environment, I am fine with this
// also the database is setup for every test file separately, so don't worry we are not sharing the database across tests
// so there are no race conditions here
let tableName: string

export const setupTestDatabase = Effect.gen(function* (_) {
  const testDb = yield* _(testDbConfig)

  if (Option.isSome(testDb.forceName)) {
    yield* _(Console.log(`Using the database ${testDb.forceName.value}`))
    process.env.DB_URL = `postgresql://${testDb.host}:${testDb.port}/${testDb.forceName.value}`
    process.env.DB_USER = testDb.username
    process.env.DB_PASSWORD = Redacted.value(testDb.password)
    return
  }

  const tablePrefix = yield* _(Config.string('TEST_DB_PREFIX'))
  tableName = `${tablePrefix}${generateUuid().replaceAll('-', '')}`
  const sql = yield* _(PgClient.PgClient)

  yield* _(Console.log(`Creating the database ${tableName}`))
  yield* _(
    sql`CREATE DATABASE ${sql.literal(tableName)};`,
    Effect.tapError((e) => Console.log(e))
  )

  process.env.DB_URL = `postgresql://${testDb.host}:${testDb.port}/${tableName}`
  process.env.DB_USER = testDb.username
  process.env.DB_PASSWORD = Redacted.value(testDb.password)
}).pipe(Effect.provide(testServicePgClient))

export const disposeTestDatabase = Effect.gen(function* (_) {
  if (yield* _(keepDbConfig)) {
    return
  }

  const sql = yield* _(PgClient.PgClient)
  yield* _(sql`DROP DATABASE ${sql.literal(tableName)};`)
}).pipe(Effect.provide(testServicePgClient))
