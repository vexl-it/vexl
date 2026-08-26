import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {Schema} from 'effect'
import {DateTime, Settings} from 'luxon'
import {parseOfferExpirationDate} from './offerAmountDetails'

describe('parseOfferExpirationDate', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'America/Los_Angeles'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  it('preserves the selected day in a negative UTC offset', () => {
    const expirationDate = Schema.decodeSync(JSDateString)('2026-10-01')

    const result = parseOfferExpirationDate(expirationDate)

    expect(DateTime.fromJSDate(result).toISODate()).toBe('2026-10-01')
  })
})
