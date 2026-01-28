#!/usr/bin/env node
import {Command} from 'commander'
import {Array as A, Effect} from 'effect'
import {Client} from 'pg'
import {loadEnvLocal} from './config/env-loader.js'
import {getDatabaseNames} from './config/services.js'
import {logError, logSuccess, logWithPrefix} from './ui/logger.js'

class DbClearError {
  readonly _tag = 'DbClearError'
  constructor(readonly message: string) {}
}

interface DbConnectionConfig {
  readonly host: string
  readonly port: number
  readonly user: string
  readonly password: string
}

const getDbConnectionConfig = (): DbConnectionConfig => {
  const dbUrl = process.env.DB_URL ?? 'postgresql://localhost:5432/vexl-dev'
  const url = new URL(dbUrl)
  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'root',
  }
}

/**
 * Check if a database exists.
 */
const databaseExists = (
  client: Client,
  dbName: string
): Effect.Effect<boolean, DbClearError> =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: async () =>
        await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
          dbName,
        ]),
      catch: (e) =>
        new DbClearError(`Failed to check database ${dbName}: ${String(e)}`),
    })
    return result.rows.length > 0
  })

/**
 * Terminate all active connections to a database and drop it.
 * The database will be recreated by the seeder on next startup.
 */
const dropDatabase = (
  client: Client,
  dbName: string
): Effect.Effect<void, DbClearError> =>
  Effect.gen(function* () {
    // Terminate active connections first
    yield* Effect.tryPromise({
      try: async () => {
        await client.query(
          `SELECT pg_terminate_backend(pg_stat_activity.pid)
           FROM pg_stat_activity
           WHERE pg_stat_activity.datname = $1
             AND pid <> pg_backend_pid()`,
          [dbName]
        )
      },
      catch: (e) =>
        new DbClearError(
          `Failed to terminate connections to ${dbName}: ${String(e)}`
        ),
    })

    // Drop the database
    yield* Effect.tryPromise({
      try: async () => {
        await client.query(`DROP DATABASE "${dbName}"`)
      },
      catch: (e) =>
        new DbClearError(`Failed to drop database ${dbName}: ${String(e)}`),
    })
  })

const main = Effect.gen(function* () {
  console.log('')
  logWithPrefix('clear-db', 'Vexl Dev Database Cleaner')
  logWithPrefix('clear-db', '='.repeat(40))
  console.log('')

  // Load environment
  yield* loadEnvLocal

  const config = getDbConnectionConfig()
  const databases = getDatabaseNames()

  // Connect to postgres system database for admin operations
  const adminClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
  })

  yield* Effect.tryPromise({
    try: async () => {
      await adminClient.connect()
    },
    catch: (e) =>
      new DbClearError(
        `Failed to connect to PostgreSQL. Is Docker running?\n${String(e)}`
      ),
  })

  yield* Effect.acquireUseRelease(
    Effect.succeed(adminClient),
    (c) =>
      Effect.gen(function* () {
        const existingDatabases = yield* Effect.filter(databases, (dbName) =>
          databaseExists(c, dbName)
        )

        if (!A.isNonEmptyArray(existingDatabases)) {
          logWithPrefix('clear-db', 'No databases found. Nothing to clear.')
          return
        }

        logWithPrefix(
          'clear-db',
          `Dropping ${existingDatabases.length} databases...`
        )
        console.log('')

        // Drop each database
        yield* Effect.forEach(existingDatabases, (dbName) =>
          Effect.gen(function* () {
            yield* dropDatabase(c, dbName)
            logSuccess('clear-db', `Dropped database: ${dbName}`)
          })
        )

        console.log('')
        logSuccess('clear-db', 'All databases dropped!')
        logWithPrefix(
          'clear-db',
          'They will be recreated on next dev orchestrator startup.'
        )
      }),
    (c) =>
      Effect.promise(async () => {
        try {
          await c.end()
        } catch {
          // Ignore disconnect errors
        }
      })
  )
})

const program = new Command()

program
  .name('clear-db')
  .description('Drop all dev databases (recreated on next startup)')
  .version('1.0.0')
  .action(async () => {
    await Effect.runPromise(
      main.pipe(
        Effect.catchAll((error) => {
          if (error instanceof DbClearError) {
            logError('clear-db', error.message)
          } else {
            logError('clear-db', `Unexpected error: ${String(error)}`)
          }
          return Effect.sync(() => process.exit(1))
        })
      )
    )
  })

program.parse()
