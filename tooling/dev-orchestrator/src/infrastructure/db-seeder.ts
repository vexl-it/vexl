import {Effect} from 'effect'
import {Client} from 'pg'
import {getDatabaseNames} from '../config/services.js'
import {logSuccess, logWithPrefix} from '../ui/logger.js'

export class DbSeedError {
  readonly _tag = 'DbSeedError'
  constructor(readonly message: string) {}
}

interface DbSeedConfig {
  readonly host: string
  readonly port: number
  readonly user: string
  readonly password: string
}

/**
 * Create a database if it doesn't exist.
 * Idempotent: checks pg_database before creating, handles race conditions.
 */
const createDatabaseIfNotExists = (
  client: Client,
  dbName: string
): Effect.Effect<boolean, DbSeedError> =>
  Effect.gen(function* () {
    // Check if database exists
    const existsResult = yield* Effect.tryPromise({
      try: async () =>
        await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
          dbName,
        ]),
      catch: (e) =>
        new DbSeedError(`Failed to check database ${dbName}: ${String(e)}`),
    })

    if (existsResult.rows.length > 0) {
      return false // Already exists
    }

    // Create database - note: cannot use parameterized query for CREATE DATABASE
    yield* Effect.tryPromise({
      try: async () => {
        try {
          await client.query(`CREATE DATABASE "${dbName}"`)
        } catch (e) {
          // Handle race condition: database created by another process
          if (!String(e).includes('42P04')) {
            throw e
          }
          // Error 42P04 = database already exists, treat as success
        }
      },
      catch: (e) =>
        new DbSeedError(`Failed to create database ${dbName}: ${String(e)}`),
    })

    return true // Created
  })

/**
 * Seed databases for all services that need them.
 * Runs after Docker infrastructure is healthy, before services start.
 *
 * Per RESEARCH.md:
 * - Connects to 'postgres' system database for admin operations
 * - Idempotent: safe to run multiple times
 * - Non-destructive: never drops or truncates existing databases
 */
export const seedDatabases = (
  config: DbSeedConfig
): Effect.Effect<void, DbSeedError> =>
  Effect.gen(function* () {
    const databases = getDatabaseNames()

    if (databases.length === 0) {
      logWithPrefix('seeder', 'No databases to seed')
      return
    }

    logWithPrefix('seeder', `Seeding ${databases.length} databases...`)

    // Connect to postgres system database for admin operations
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: 'postgres', // System database
    })

    yield* Effect.tryPromise({
      try: async () => {
        await client.connect()
      },
      catch: (e) =>
        new DbSeedError(`Failed to connect to postgres: ${String(e)}`),
    })

    yield* Effect.acquireUseRelease(
      Effect.succeed(client),
      () =>
        Effect.forEach(databases, (dbName) =>
          Effect.gen(function* () {
            const created = yield* createDatabaseIfNotExists(client, dbName)
            if (created) {
              logSuccess('seeder', `Created database: ${dbName}`)
            } else {
              logWithPrefix('seeder', `Database exists: ${dbName}`)
            }
          })
        ),
      (c) =>
        Effect.promise(async () => {
          try {
            await c.end()
          } catch {
            // Ignore disconnect errors
          }
        })
    )

    logSuccess('seeder', 'Database seeding complete')
  })
