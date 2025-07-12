import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  type BlogId,
  type BlogSlug,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Layer, Option} from 'effect'
import {WebflowCmsService} from '../../utils/webflowCms'

export const dummyWebflowEvents = {
  items: [
    {
      id: 'webflow-event-id-001',
      cmsLocaleId: 'en_us',
      lastPublished: new Date('2025-05-10T12:00:00Z'),
      lastUpdated: new Date('2025-05-10T11:00:00Z'),
      createdOn: new Date('2025-05-01T08:00:00Z'),
      isArchived: false,
      isDraft: false,
      fieldData: {
        'start-date-time': new Date('2025-07-24T10:00:00Z'),
        'event-link': 'https://vexl.it/events/bitcoin-citadel',
        'end-date-time': Option.some(new Date('2025-07-27T18:00:00Z')),
        name: 'Bitcoin Citadel 2025',
        venue: 'Heldrungen Castle, Germany',
        'event-speakers': ['speaker-id-001', 'speaker-id-002'],
        slug: 'bitcoin-citadel-2025',
        'golden-glasses': true,
      },
    },
  ],
}

export const dummyWebflowBlogs = {
  items: [
    {
      id: 'blog-id-001' as BlogId,
      cmsLocaleId: 'en_us',
      lastPublished: new Date('2025-06-01T12:00:00Z'),
      lastUpdated: new Date('2025-06-01T11:00:00Z'),
      createdOn: new Date('2025-05-25T08:00:00Z'),
      isArchived: false,
      isDraft: false,
      fieldData: {
        'teaser-text': Option.some('This is a teaser for the blog post.'),
        'rich-text':
          '<p>This is the full rich-text content of the blog article.</p>',
        name: 'Why Peer-to-Peer Bitcoin Matters',
        slug: 'why-peer-to-peer-bitcoin-matters' as BlogSlug,
        'main-image': Option.some({
          url: 'https://vexl.it/images/blog/bitcoin-p2p.jpg' as UriString,
        }),
      },
    },
  ],
}

export const dummyWebflowSpeakers = {
  items: [
    {
      id: 'speaker-001',
      cmsLocaleId: 'en_us',
      lastPublished: new Date('2025-06-01T12:00:00Z'),
      lastUpdated: new Date('2025-06-01T11:30:00Z'),
      createdOn: new Date('2025-05-20T09:00:00Z'),
      isArchived: false,
      isDraft: false,
      fieldData: {
        'link-to-socials': Option.some('https://twitter.com/vexl_speaker'),
        name: 'Satoshi Nakamoto',
        slug: 'satoshi-nakamoto',
        'event-speaker-image': Option.some({
          url: 'https://vexl.it/images/speakers/satoshi.jpg',
        }),
      },
    },
  ],
}

export const mockedfetchWebflowEvents = jest.fn(() =>
  Effect.succeed(dummyWebflowEvents)
)
export const mockedfetchWebflowBlogs = jest.fn(() =>
  Effect.succeed(dummyWebflowBlogs)
)
export const mockedfetchWebflowSpeakers = jest.fn(() =>
  Effect.succeed(dummyWebflowSpeakers)
)

export const mockedWebflowCmsService = Layer.succeed(WebflowCmsService, {
  fetchEvents: mockedfetchWebflowEvents,
  fetchBlogs: mockedfetchWebflowBlogs,
  fetchSpeakers: mockedfetchWebflowSpeakers,
})
