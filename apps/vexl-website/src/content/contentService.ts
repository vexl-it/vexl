import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {type BlogPost, type CmsEvent} from '@vexl-next/domain/src/general/cms'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {Config, Duration, Effect, Schema} from 'effect'

const CACHE_TTL = Duration.seconds(60)

export class ContentServiceError extends Schema.TaggedError<ContentServiceError>(
  'ContentServiceError'
)('ContentServiceError', {content: Schema.String}) {}

const websiteClient = Effect.gen(function* () {
  const baseUrl = yield* Config.string('CONTENT_SERVICE_URL')
  const client = yield* HttpApiClient.make(ContentInternalApiSpecification, {
    baseUrl,
  })
  return client.Website
})

type WebsiteClient = Effect.Effect.Success<typeof websiteClient>

/**
 * Successful responses are kept in memory for a minute, failures are retried
 * on the next request. Both the pages and the proxy read through this.
 */
function cachedContent<A, E extends {readonly _tag: string}>(
  content: string,
  request: (website: WebsiteClient) => Effect.Effect<A, E>
): () => Promise<A> {
  const fetchContent = websiteClient.pipe(
    Effect.flatMap(request),
    Effect.provide(FetchHttpClient.layer),
    Effect.tapError((error) =>
      Effect.sync(() => {
        // The tag only: decode errors carry the response payload
        console.error(
          `Loading ${content} from content-service failed: ${error._tag}`
        )
      })
    ),
    Effect.mapError(() => new ContentServiceError({content}))
  )
  const [cached, invalidate] = Effect.runSync(
    Effect.cachedInvalidateWithTTL(fetchContent, CACHE_TTL)
  )
  return async () =>
    await Effect.runPromise(Effect.tapError(cached, () => invalidate))
}

export const loadPublishedBlogPosts: () => Promise<readonly BlogPost[]> =
  cachedContent('blog posts', (website) =>
    Effect.map(website.getPublishedBlogPosts({}), (res) => res.blogPosts)
  )

export const loadPublishedEvents: () => Promise<readonly CmsEvent[]> =
  cachedContent('events', (website) =>
    Effect.map(website.getPublishedEvents({}), (res) => res.events)
  )
