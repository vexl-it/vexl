import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Either, Schema} from 'effect'
import {ReportFrontendEventRequest} from './contracts'

const eventId = Schema.decodeSync(Uuid)('00000000-0000-4000-8000-000000000002')
const analyticsId = Schema.decodeSync(Uuid)(
  '00000000-0000-4000-8000-000000000001'
)
const date = '2026-05-18T12:00:00.000Z'

describe('ReportFrontendEventRequest', () => {
  it('accepts known frontend event literals', () => {
    const decoded = Schema.decodeUnknownEither(ReportFrontendEventRequest)({
      id: eventId,
      analyticsId,
      event: 'offerRequested',
      date,
    })

    expect(Either.isRight(decoded)).toBe(true)
  })

  it('rejects unknown frontend event literals', () => {
    const decoded = Schema.decodeUnknownEither(ReportFrontendEventRequest)({
      id: eventId,
      analyticsId,
      event: 'offerOpened',
      date,
    })

    expect(Either.isLeft(decoded)).toBe(true)
  })
})
