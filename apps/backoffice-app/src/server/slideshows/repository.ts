import {
  type CreateSlideshowRequest,
  SlideshowSlides,
  TvSlideshow,
  type UpdateSlideshowRequest,
} from '@/src/services/slideshows/domain'
import {PgClient} from '@effect/sql-pg'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {randomBytes, randomUUID} from 'node:crypto'

interface SlideshowRow {
  readonly uuid: string
  readonly publicToken: string
  readonly publicSlug: string | null
  readonly name: string
  readonly slides: unknown
  readonly isEnabled: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

const generatePublicToken = (): string => randomBytes(32).toString('base64url')

const decodeSlides = Schema.decodeUnknownSync(SlideshowSlides)
const decodeSlideshow = Schema.decodeUnknownSync(TvSlideshow)

const rowToSlideshow = (row: SlideshowRow): TvSlideshow =>
  decodeSlideshow({
    uuid: row.uuid,
    publicToken: row.publicToken,
    publicSlug: row.publicSlug,
    name: row.name,
    slides: decodeSlides(row.slides),
    isEnabled: row.isEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })

const firstSlideshow = (rows: readonly SlideshowRow[]): TvSlideshow | null =>
  pipe(rows, Array.head, Option.map(rowToSlideshow), Option.getOrNull)

export const listSlideshows = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const rows = yield* _(sql<SlideshowRow>`
    SELECT
      uuid::text,
      public_token,
      public_slug,
      name,
      slides,
      is_enabled,
      created_at,
      updated_at
    FROM
      backoffice_tv_slideshows
    ORDER BY
      updated_at DESC,
      created_at DESC
  `)

  return pipe(rows, Array.map(rowToSlideshow))
})

export const findSlideshowByUuid = (
  uuid: string
): Effect.Effect<TvSlideshow | null, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<SlideshowRow>`
      SELECT
        uuid::text,
        public_token,
        public_slug,
        name,
        slides,
        is_enabled,
        created_at,
        updated_at
      FROM
        backoffice_tv_slideshows
      WHERE
        uuid = ${uuid}
      LIMIT
        1
    `)

    return firstSlideshow(rows)
  })

export const findEnabledSlideshowByPublicIdentifier = (
  publicIdentifier: string
): Effect.Effect<TvSlideshow | null, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<SlideshowRow>`
      SELECT
        uuid::text,
        public_token,
        public_slug,
        name,
        slides,
        is_enabled,
        created_at,
        updated_at
      FROM
        backoffice_tv_slideshows
      WHERE
        (
          public_token = ${publicIdentifier}
          OR public_slug = ${publicIdentifier}
        )
        AND is_enabled = TRUE
      LIMIT
        1
    `)

    return firstSlideshow(rows)
  })

export const isPublicSlugAvailable = (
  publicSlug: string,
  exceptUuid: string | null
): Effect.Effect<boolean, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<{readonly uuid: string}>`
      SELECT
        uuid::text
      FROM
        backoffice_tv_slideshows
      WHERE
        public_slug = ${publicSlug}
        AND (
          ${exceptUuid}::uuid IS NULL
          OR uuid <> ${exceptUuid}
        )
      LIMIT
        1
    `)

    return !Array.isNonEmptyReadonlyArray(rows)
  })

export const createSlideshow = (
  input: CreateSlideshowRequest
): Effect.Effect<TvSlideshow, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const uuid = input.uuid ?? randomUUID()
    const publicToken = generatePublicToken()
    const slides = decodeSlides(input.slides)
    const rows = yield* _(sql<SlideshowRow>`
      INSERT INTO
        backoffice_tv_slideshows (
          uuid,
          public_token,
          public_slug,
          name,
          slides,
          is_enabled
        )
      VALUES
        (
          ${uuid},
          ${publicToken},
          ${input.publicSlug ?? null},
          ${input.name},
          ${JSON.stringify(slides)}::jsonb,
          ${input.isEnabled}
        )
      RETURNING
        uuid::text,
        public_token,
        public_slug,
        name,
        slides,
        is_enabled,
        created_at,
        updated_at
    `)

    return pipe(rows, Array.head, Option.map(rowToSlideshow), Option.getOrThrow)
  })

export const updateSlideshow = (
  uuid: string,
  input: UpdateSlideshowRequest
): Effect.Effect<TvSlideshow | null, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const slides = decodeSlides(input.slides)
    const rows = yield* _(sql<SlideshowRow>`
      UPDATE backoffice_tv_slideshows
      SET
        public_slug = ${input.publicSlug},
        name = ${input.name},
        slides = ${JSON.stringify(slides)}::jsonb,
        is_enabled = ${input.isEnabled},
        updated_at = now()
      WHERE
        uuid = ${uuid}
      RETURNING
        uuid::text,
        public_token,
        public_slug,
        name,
        slides,
        is_enabled,
        created_at,
        updated_at
    `)

    return firstSlideshow(rows)
  })

export const deleteSlideshow = (
  uuid: string
): Effect.Effect<boolean, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<{readonly uuid: string}>`
      DELETE FROM backoffice_tv_slideshows
      WHERE
        uuid = ${uuid}
      RETURNING
        uuid::text
    `)

    return Array.isNonEmptyReadonlyArray(rows)
  })

export const duplicateSlideshow = (
  uuid: string
): Effect.Effect<TvSlideshow | null, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const original = yield* _(findSlideshowByUuid(uuid))

    if (!original) return null

    return yield* _(
      createSlideshow({
        uuid: randomUUID(),
        name: `${original.name} copy`,
        slides: original.slides,
        isEnabled: false,
      })
    )
  })

export const regenerateSlideshowToken = (
  uuid: string
): Effect.Effect<TvSlideshow | null, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<SlideshowRow>`
      UPDATE backoffice_tv_slideshows
      SET
        public_token = ${generatePublicToken()},
        updated_at = now()
      WHERE
        uuid = ${uuid}
      RETURNING
        uuid::text,
        public_token,
        public_slug,
        name,
        slides,
        is_enabled,
        created_at,
        updated_at
    `)

    return firstSlideshow(rows)
  })
