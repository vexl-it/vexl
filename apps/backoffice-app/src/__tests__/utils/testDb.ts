import {PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {Effect, Layer} from 'effect'
import {randomBytes} from 'node:crypto'
import {backofficeDatabaseConfig} from '../../server/config'
import {dbRuntime, runDb} from '../../server/db'
import {runBackofficeMigrations} from '../../server/migrations'

const MaintenanceSql = backofficeDatabaseConfig.pipe(
  Effect.map((config) => PgClient.layer({...config, database: 'postgres'})),
  Layer.unwrapEffect
)

const runMaintenance = (
  statement: (sql: PgClient.PgClient) => Effect.Effect<unknown, SqlError>
): Promise<unknown> =>
  Effect.runPromise(
    Effect.flatMap(PgClient.PgClient, statement).pipe(
      Effect.provide(MaintenanceSql)
    )
  )

/** Gives the test file its own migrated database and empties the access tables before each test. */
export const setUpTestDatabase = (): void => {
  const database = `backoffice_test_${randomBytes(8).toString('hex')}`

  beforeAll(async () => {
    process.env.DB_NAME = database
    await runMaintenance((sql) => sql`CREATE DATABASE ${sql.literal(database)}`)
    await runBackofficeMigrations()
  })

  beforeEach(() =>
    runSql(
      (sql) => sql`
        TRUNCATE backoffice_passkeys,
        backoffice_invites,
        backoffice_webauthn_challenges CASCADE
      `
    )
  )

  afterAll(async () => {
    await dbRuntime.dispose()
    await runMaintenance((sql) => sql`DROP DATABASE ${sql.literal(database)}`)
  })
}

export const runSql = <A>(
  statement: (sql: PgClient.PgClient) => Effect.Effect<A, SqlError>
): Promise<A> => runDb(Effect.flatMap(PgClient.PgClient, statement))

type ExpiringTable =
  | 'backoffice_invites'
  | 'backoffice_sessions'
  | 'backoffice_webauthn_challenges'

/** Moves every row of the table past its expiry, as if its lifetime had passed. */
export const expireRows = (table: ExpiringTable): Promise<unknown> =>
  runSql(
    (sql) => sql`
      UPDATE ${sql(table)}
      SET
        expires_at = now() - interval '1 second'
    `
  )

/** Seconds the newest row of the table has left, read from the database clock. */
export const secondsUntilExpiry = (table: ExpiringTable): Promise<number> =>
  runSql((sql) =>
    Effect.map(
      sql<{readonly seconds: number}>`
        SELECT
          extract(
            epoch
            FROM
              max(expires_at) - now()
          )::float8 AS seconds
        FROM
          ${sql(table)}
      `,
      ([row]) => row?.seconds ?? Number.NaN
    )
  )
