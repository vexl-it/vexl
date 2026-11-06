import {SqlClient} from '@effect/sql'
import {type SqlError} from '@effect/sql/SqlError'
import {BlogPost, CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Effect, Schema} from 'effect'
import {BlogPostsDbService} from '../db/BlogPostsDbService'
import {EventsDbService} from '../db/EventsDbService'
import importWebflowSnapshot from '../db/migrations/0003_importWebflowSnapshot'
import webflowSnapshot from '../db/migrations/webflowSnapshot.json'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const snapshot = Schema.decodeUnknownSync(
  Schema.Struct({
    blogPosts: Schema.Array(BlogPost),
    events: Schema.Array(CmsEvent),
  })
)(webflowSnapshot)

const countRows = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)
  const [blogPosts] = yield* _(sql<{count: string}>`
    SELECT
      count(*)
    FROM
      blog_posts
  `)
  const [events] = yield* _(sql<{count: string}>`
    SELECT
      count(*)
    FROM
      events
  `)
  return {blogPosts: Number(blogPosts.count), events: Number(events.count)}
})

describe('Webflow snapshot import', () => {
  it('imports every snapshot item as published during migration', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const blogPosts = yield* _(
          BlogPostsDbService,
          Effect.flatMap((db) => db.listPublishedBlogPosts)
        )
        const events = yield* _(
          EventsDbService,
          Effect.flatMap((db) => db.listPublishedEvents)
        )

        expect(blogPosts).toHaveLength(snapshot.blogPosts.length)
        expect(events).toHaveLength(snapshot.events.length)
        expect(new Set(blogPosts)).toEqual(new Set(snapshot.blogPosts))
        expect(new Set(events)).toEqual(new Set(snapshot.events))
      })
    )
  })

  it('is idempotent and keeps rows edited after the import', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        const [first] = snapshot.blogPosts
        const setTitle = (
          title: string
        ): Effect.Effect<unknown, SqlError> => sql`
          UPDATE blog_posts
          SET
            title_en = ${title}
          WHERE
            id = ${first.id}
        `

        yield* _(
          Effect.gen(function* (_) {
            yield* _(setTitle('Edited'))
            const before = yield* _(countRows)

            yield* _(importWebflowSnapshot)

            expect(yield* _(countRows)).toEqual(before)
            const [row] = yield* _(sql<{
              titleEn: string
            }>`
              SELECT
                title_en
              FROM
                blog_posts
              WHERE
                id = ${first.id}
            `)
            expect(row.titleEn).toEqual('Edited')
          }),
          Effect.ensuring(Effect.orDie(setTitle(first.en.title)))
        )
      })
    )
  })
})
