import {PgClient} from '@effect/sql-pg'
import {Array, Effect} from 'effect'
import {runDb} from './db'
import createTvSlideshows from './migrations/0001_create_tv_slideshows'
import addPublicSlug from './migrations/0002_add_public_slug'

interface Migration {
  readonly id: number
  readonly name: string
  readonly effect: Effect.Effect<unknown, unknown, PgClient.PgClient>
}

interface AppliedMigrationRow {
  readonly id: number
}

const migrations: readonly Migration[] = [
  {
    id: 1,
    name: 'create_tv_slideshows',
    effect: createTvSlideshows,
  },
  {
    id: 2,
    name: 'add_public_slug',
    effect: addPublicSlug,
  },
]

export const runBackofficeMigrationsEffect = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  yield* _(sql`
    CREATE TABLE IF NOT EXISTS backoffice_migrations (
      id integer PRIMARY KEY,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `)

  yield* _(
    Effect.forEach(
      migrations,
      (migration) =>
        Effect.gen(function* (_) {
          const applied = yield* _(sql<AppliedMigrationRow>`
            SELECT
              id
            FROM
              backoffice_migrations
            WHERE
              id = ${migration.id}
            LIMIT
              1
          `)

          if (Array.isNonEmptyReadonlyArray(applied)) return

          yield* _(
            sql.withTransaction(
              Effect.gen(function* (_) {
                yield* _(migration.effect)
                yield* _(sql`
                  INSERT INTO
                    backoffice_migrations (id, name)
                  VALUES
                    (
                      ${migration.id},
                      ${migration.name}
                    )
                `)
              })
            )
          )
        }),
      {discard: true}
    )
  )
})

export const runBackofficeMigrations = (): Promise<void> =>
  runDb(runBackofficeMigrationsEffect).then(() => undefined)
