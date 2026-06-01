import {Option, Schema} from 'effect'
import {WebflowEventsResponse} from '../../utils/webflowCms/domain'

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
    'event-speakers': [],
    slug: 'bitcoin-citadel-2025',
    'golden-glasses': true,
  },
}

describe('WebflowEventsResponse', () => {
  it('accepts null end date from Webflow', () => {
    const decoded = Schema.decodeUnknownSync(WebflowEventsResponse)({
      items: [rawWebflowEvent],
    })

    expect(Option.isNone(decoded.items[0].fieldData['end-date-time'])).toBe(
      true
    )
  })
})
