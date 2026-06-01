import {Option, Schema} from 'effect'
import {
  WebflowBlogsResponse,
  WebflowEventsResponse,
  WebflowSpeakersResponse,
} from '../../utils/webflowCms/domain'

const rawWebflowEvent = {
  id: 'webflow-event-id-001',
  cmsLocaleId: 'en_us',
  lastPublished: '2025-05-10T12:00:00Z',
  lastUpdated: '2025-05-10T11:00:00Z',
  createdOn: '2025-05-01T08:00:00Z',
  isArchived: false,
  isDraft: false,
  fieldData: {
    'start-date-time': '2025-07-24T10:00:00Z',
    'event-link': 'https://vexl.it/events/bitcoin-citadel',
    'end-date-time': null,
    name: 'Bitcoin Citadel 2025',
    venue: 'Heldrungen Castle, Germany',
    'event-speakers': null,
    slug: 'bitcoin-citadel-2025',
    'golden-glasses': null,
  },
}

const rawWebflowSpeaker = {
  id: 'speaker-id-001',
  cmsLocaleId: 'en_us',
  lastPublished: '2025-06-01T12:00:00Z',
  lastUpdated: '2025-06-01T11:30:00Z',
  createdOn: '2025-05-20T09:00:00Z',
  isArchived: false,
  isDraft: false,
  fieldData: {
    'link-to-socials': null,
    name: 'Satoshi Nakamoto',
    slug: 'satoshi-nakamoto',
    'event-speaker-image': null,
  },
}

const rawWebflowBlog = {
  id: 'blog-id-001',
  cmsLocaleId: 'en_us',
  lastPublished: '2025-06-01T12:00:00Z',
  lastUpdated: '2025-06-01T11:00:00Z',
  createdOn: '2025-05-25T08:00:00Z',
  isArchived: false,
  isDraft: false,
  fieldData: {
    'teaser-text': null,
    'rich-text': '<p>This is the full rich-text content.</p>',
    name: 'Why Peer-to-Peer Bitcoin Matters',
    slug: 'why-peer-to-peer-bitcoin-matters',
    'main-image': null,
  },
}

describe('WebflowEventsResponse', () => {
  it('accepts nullable event fields from Webflow', () => {
    const decoded = Schema.decodeUnknownSync(WebflowEventsResponse)({
      items: [rawWebflowEvent],
    })

    expect(Option.isNone(decoded.items[0].fieldData['end-date-time'])).toBe(
      true
    )
    expect(decoded.items[0].fieldData['event-speakers']).toEqual([])
    expect(decoded.items[0].fieldData['golden-glasses']).toBe(false)
  })
})

describe('WebflowSpeakersResponse', () => {
  it('accepts nullable speaker fields from Webflow', () => {
    const decoded = Schema.decodeUnknownSync(WebflowSpeakersResponse)({
      items: [rawWebflowSpeaker],
    })

    expect(Option.isNone(decoded.items[0].fieldData['link-to-socials'])).toBe(
      true
    )
    expect(
      Option.isNone(decoded.items[0].fieldData['event-speaker-image'])
    ).toBe(true)
  })
})

describe('WebflowBlogsResponse', () => {
  it('accepts nullable blog fields from Webflow', () => {
    const decoded = Schema.decodeUnknownSync(WebflowBlogsResponse)({
      items: [rawWebflowBlog],
    })

    expect(Option.isNone(decoded.items[0].fieldData['teaser-text'])).toBe(true)
    expect(Option.isNone(decoded.items[0].fieldData['main-image'])).toBe(true)
  })
})
