import {
  type CreateShortLinkRequest,
  ShortLink,
} from '@/src/services/shortLinks/domain'
import {PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {randomInt} from 'node:crypto'
import {isUniqueViolationError} from '../db'
import {
  cacheShortLinkTarget,
  getCachedShortLinkTarget,
  invalidateShortLinkTarget,
} from './cache'

interface ShortLinkRow {
  readonly slug: string
  readonly targetUrl: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly totalClicks: number
  readonly clicksLast7Days: number
  readonly dailyClicks: unknown
}

export class ShortLinkSlugTakenError extends Schema.TaggedError<ShortLinkSlugTakenError>(
  'ShortLinkSlugTakenError'
)('ShortLinkSlugTakenError', {
  slug: Schema.String,
}) {}

// No i, l, o, 0, 1: they are easy to confuse when a link is read out or printed.
const RANDOM_SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const RANDOM_SLUG_LENGTH = 6
const RANDOM_SLUG_COLLISION_RETRIES = 5

const generateRandomSlug = (): string =>
  pipe(
    Array.makeBy(RANDOM_SLUG_LENGTH, () =>
      RANDOM_SLUG_ALPHABET.charAt(randomInt(RANDOM_SLUG_ALPHABET.length))
    ),
    Array.join('')
  )

const decodeShortLink = Schema.decodeUnknownSync(ShortLink)

const rowToShortLink = (row: ShortLinkRow): ShortLink =>
  decodeShortLink({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })

const selectShortLinks = (
  slug: string | null
): Effect.Effect<readonly ShortLink[], SqlError, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<ShortLinkRow>`
      SELECT
        l.slug,
        l.target_url,
        l.created_at,
        l.updated_at,
        COALESCE(SUM(c.count), 0)::int AS total_clicks,
        COALESCE(
          SUM(c.count) FILTER (
            WHERE
              c.day >= CURRENT_DATE - 6
          ),
          0
        )::int AS clicks_last7_days,
        COALESCE(
          json_agg(
            json_build_object('day', c.day, 'count', c.count)
            ORDER BY
              c.day
          ) FILTER (
            WHERE
              c.day >= CURRENT_DATE - 29
          ),
          '[]'::json
        ) AS daily_clicks
      FROM
        backoffice_short_links l
        LEFT JOIN backoffice_short_link_clicks c ON c.slug = l.slug
      WHERE
        ${slug}::text IS NULL
        OR l.slug = ${slug}
      GROUP BY
        l.slug
      ORDER BY
        l.created_at DESC
    `)

    return pipe(rows, Array.map(rowToShortLink))
  })

export const listShortLinks = selectShortLinks(null)

const findShortLink = (
  slug: string
): Effect.Effect<ShortLink | null, SqlError, PgClient.PgClient> =>
  selectShortLinks(slug).pipe(
    Effect.map((links) => pipe(links, Array.head, Option.getOrNull))
  )

const insertShortLink = (
  slug: string,
  targetUrl: string
): Effect.Effect<
  ShortLink,
  SqlError | ShortLinkSlugTakenError,
  PgClient.PgClient
> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    yield* _(
      sql`
        INSERT INTO
          backoffice_short_links (slug, target_url)
        VALUES
          (
            ${slug},
            ${targetUrl}
          )
      `.pipe(
        Effect.catchIf(
          isUniqueViolationError,
          () => new ShortLinkSlugTakenError({slug})
        )
      )
    )

    return yield* _(
      findShortLink(slug),
      Effect.flatMap(Effect.fromNullable),
      Effect.orDie
    )
  })

export const createShortLink = (
  input: CreateShortLinkRequest
): Effect.Effect<
  ShortLink,
  SqlError | ShortLinkSlugTakenError,
  PgClient.PgClient
> =>
  input.slug !== undefined
    ? insertShortLink(input.slug, input.targetUrl)
    : Effect.suspend(() =>
        insertShortLink(generateRandomSlug(), input.targetUrl)
      ).pipe(
        Effect.retry({
          while: (error) => error._tag === 'ShortLinkSlugTakenError',
          times: RANDOM_SLUG_COLLISION_RETRIES,
        })
      )

export const updateShortLinkTarget = (
  slug: string,
  targetUrl: string
): Effect.Effect<ShortLink | null, SqlError, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    yield* _(sql`
      UPDATE backoffice_short_links
      SET
        target_url = ${targetUrl},
        updated_at = now()
      WHERE
        slug = ${slug}
    `)
    yield* _(invalidateShortLinkTarget(slug))

    return yield* _(findShortLink(slug))
  })

export const deleteShortLink = (
  slug: string
): Effect.Effect<boolean, SqlError, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<{readonly slug: string}>`
      DELETE FROM backoffice_short_links
      WHERE
        slug = ${slug}
      RETURNING
        slug
    `)
    yield* _(invalidateShortLinkTarget(slug))

    return Array.isNonEmptyReadonlyArray(rows)
  })

const findShortLinkTargetInDb = (
  slug: string
): Effect.Effect<string | null, SqlError, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<{readonly targetUrl: string}>`
      SELECT
        target_url
      FROM
        backoffice_short_links
      WHERE
        slug = ${slug}
      LIMIT
        1
    `)

    return pipe(
      rows,
      Array.head,
      Option.map((row) => row.targetUrl),
      Option.getOrNull
    )
  })

// Targets are cached for a day on first use and dropped on edit or delete.
export const findShortLinkTarget = (
  slug: string
): Effect.Effect<string | null, SqlError, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const cached = yield* _(getCachedShortLinkTarget(slug))
    if (Option.isSome(cached)) return cached.value

    const targetUrl = yield* _(findShortLinkTargetInDb(slug))
    if (targetUrl !== null) yield* _(cacheShortLinkTarget(slug, targetUrl))

    return targetUrl
  })

// Only a per-day counter is kept: no IP, user agent, or referrer.
export const recordShortLinkClick = (
  slug: string
): Effect.Effect<void, SqlError, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    yield* _(sql`
      INSERT INTO
        backoffice_short_link_clicks (slug, DAY, count)
      VALUES
        (
          ${slug},
          CURRENT_DATE,
          1
        )
      ON CONFLICT (slug, DAY) DO UPDATE
      SET
        count = backoffice_short_link_clicks.count + 1
    `)
  })
