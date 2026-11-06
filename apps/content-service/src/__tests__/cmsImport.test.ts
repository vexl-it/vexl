import {SqlClient} from '@effect/sql'
import {Array, Effect, Option, Schema} from 'effect'
import {CmsSnapshot, importCmsSnapshot} from '../cmsImport/importCmsSnapshot'
import webflowSnapshot from '../cmsImport/webflowSnapshot.json'
import {BlogPostsDbService} from '../db/BlogPostsDbService'
import {EventsDbService} from '../db/EventsDbService'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const snapshot = Schema.decodeUnknownSync(CmsSnapshot)(webflowSnapshot)

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

  it('keeps Czech versions and English-only legacy posts', () => {
    const bySlug = (slug: string): (typeof snapshot.blogPosts)[number] =>
      Option.getOrThrow(
        Array.findFirst(snapshot.blogPosts, (one) => one.slug === slug)
      )

    const translated = bySlug('pub-quiz-and-btalks-are-here')
    expect(Option.map(translated.cs, (cs) => cs.title)).toEqual(
      Option.some('Bitcoinové herní a konverzační kartičky jsou tady!')
    )
    expect(Option.isNone(bySlug('so-what-is-vexl-anyway').cs)).toBe(true)
  })

  it('references only rehosted images', () => {
    expect(JSON.stringify(webflowSnapshot)).not.toMatch(
      /website-files\.com|webflow\.com/
    )
  })

  it('is idempotent and keeps rows edited after the import', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        const [first] = snapshot.blogPosts
        yield* _(sql`
          UPDATE blog_posts
          SET
            title_en = 'Edited'
          WHERE
            id = ${first.id}
        `)
        const before = yield* _(countRows)

        yield* _(importCmsSnapshot)

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
      })
    )
  })
})
