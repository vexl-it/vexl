import {BlogPost, CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Effect, Schema} from 'effect'
import {createInsertBlogPostIfMissing} from '../db/BlogPostsDbService'
import {createInsertEventIfMissing} from '../db/EventsDbService'
import webflowSnapshot from './webflowSnapshot.json'

export const CmsSnapshot = Schema.Struct({
  blogPosts: Schema.Array(BlogPost),
  events: Schema.Array(CmsEvent),
})

/** Idempotent: rows that already exist are left as they are. */
export const importCmsSnapshot = Effect.gen(function* (_) {
  const snapshot = yield* _(
    Schema.decodeUnknown(CmsSnapshot)(webflowSnapshot),
    Effect.orDie
  )
  const insertBlogPost = yield* _(createInsertBlogPostIfMissing)
  const insertEvent = yield* _(createInsertEventIfMissing)

  yield* _(Effect.forEach(snapshot.blogPosts, insertBlogPost, {discard: true}))
  yield* _(Effect.forEach(snapshot.events, insertEvent, {discard: true}))
}).pipe(Effect.withSpan('importCmsSnapshot'))
