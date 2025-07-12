import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  type EventId,
  type Speaker,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Layer, Option} from 'effect'
import {CacheService} from '../../utils/cache'

export const dummyEvents = {
  events: [
    {
      id: 'event-123' as EventId, // Replace with valid EventId type if more specific
      startDate: new Date('2025-09-15T09:00:00Z'),
      endDate: Option.some(new Date('2025-09-15T17:00:00Z')), // or null if using Option.None
      link: 'https://bitcoinparaguay.org/event/123',
      name: 'Bitcoin Paraguay Meetup',
      venue: 'Asunción Tech Hub',
      speakers: [
        {
          name: 'Juan Nakamoto',
          linkToSocials: Option.some('https://example.com/bio/juan'),
          imageUrl: Option.some('https://example.com/avatars/juan.png'),
        } satisfies Speaker,
      ],
      goldenGlasses: true,
    },
  ] as const,
}

const dummyBlogArticlesResponse = {
  articles: [
    {
      id: 'blog-id-123' as any, // Cast to BlogId
      title: 'How to Buy Bitcoin Privately',
      slug: 'buy-bitcoin-privately' as any, // Cast to BlogSlug
      teaserText: Option.some(
        'Learn the basics of buying bitcoin without KYC.'
      ),
      mainImage: Option.some('https://example.com/image.jpg' as UriString),
      link: 'https://vexl.it/blog/buy-bitcoin-privately',
      publishedOn: new Date('2025-01-01'),
    },
  ],
}

export const mockedGetEventsFromRedis = Effect.succeed(Option.some(dummyEvents))
export const mockedBlogsFromRedis = Effect.succeed(
  Option.some(dummyBlogArticlesResponse)
)
export const mockedClearCache = Effect.void
export const mockedSaveBlogsToCacheForked = jest.fn(() => Effect.void)
export const mockedSaveEventsToCacheForked = jest.fn(() => Effect.void)

export const mockedCacheService = Layer.succeed(CacheService, {
  getEventsFromRedis: mockedGetEventsFromRedis,
  getBlogsFromRedis: mockedBlogsFromRedis,
  clearCache: mockedClearCache,
  saveBlogsToCacheForked: mockedSaveBlogsToCacheForked,
  saveEventsToCacheForked: mockedSaveEventsToCacheForked,
})
