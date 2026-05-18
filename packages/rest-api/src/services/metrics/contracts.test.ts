import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Either, Schema} from 'effect'
import {ReportFrontendEventRequest} from './contracts'

const analyticsUuid = Schema.decodeSync(Uuid)(
  '00000000-0000-4000-8000-000000000001'
)

describe('ReportFrontendEventRequest', () => {
  it('accepts known frontend event literals', () => {
    const decoded = Schema.decodeUnknownEither(ReportFrontendEventRequest)({
      analyticsUuid,
      event: 'offerRequested',
    })

    expect(Either.isRight(decoded)).toBe(true)
  })

  it('rejects unknown frontend event literals', () => {
    const decoded = Schema.decodeUnknownEither(ReportFrontendEventRequest)({
      analyticsUuid,
      event: 'offerOpened',
    })

    expect(Either.isLeft(decoded)).toBe(true)
  })
})
