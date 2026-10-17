import {Schema} from 'effect'
import {describe, expect, it} from 'vitest'
import {
  bucketClubCount,
  bucketDays,
  bucketDormancy,
  bucketDuration,
  bucketOffersVisible,
  bucketRequestCount,
  bucketStartDay,
  bucketTenure,
  cappedCounter,
  dayOf,
  isoWeekStart,
  updatedDayFor,
  utcDaysBetween,
} from './buckets'
import {DayString} from './core'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

describe('dayOf', () => {
  it('uses the UTC date, not the local one', () => {
    expect(dayOf(new Date('2026-03-31T23:59:59.999Z'))).toBe('2026-03-31')
    expect(dayOf(new Date('2026-04-01T00:00:00.000Z'))).toBe('2026-04-01')
  })
})

describe('isoWeekStart', () => {
  it('returns the same day for a Monday', () => {
    expect(isoWeekStart(new Date('2026-09-21T10:00:00Z'))).toBe('2026-09-21')
  })

  it('returns the previous Monday for a Sunday', () => {
    expect(isoWeekStart(new Date('2026-09-27T23:59:59Z'))).toBe('2026-09-21')
  })

  it('crosses the year boundary backwards', () => {
    expect(isoWeekStart(new Date('2027-01-01T00:00:00Z'))).toBe('2026-12-28')
    expect(isoWeekStart(new Date('2027-01-03T12:00:00Z'))).toBe('2026-12-28')
    expect(isoWeekStart(new Date('2027-01-04T00:00:00Z'))).toBe('2027-01-04')
  })

  it('handles a year that starts on a Monday and a week 53 year', () => {
    expect(isoWeekStart(new Date('2024-01-01T00:00:00Z'))).toBe('2024-01-01')
    expect(isoWeekStart(new Date('2020-12-31T00:00:00Z'))).toBe('2020-12-28')
    expect(isoWeekStart(new Date('2021-01-03T00:00:00Z'))).toBe('2020-12-28')
  })

  it('uses UTC for the week day', () => {
    expect(isoWeekStart(new Date('2026-09-27T23:30:00-02:00'))).toBe(
      '2026-09-28'
    )
  })
})

describe('bucketStartDay', () => {
  const now = new Date('2026-09-23T23:59:59Z')

  it('is the UTC day for day buckets', () => {
    expect(bucketStartDay('day', now)).toBe('2026-09-23')
  })

  it('is the ISO week start for week buckets', () => {
    expect(bucketStartDay('week', now)).toBe('2026-09-21')
  })

  it('is the first of the UTC month for month buckets', () => {
    expect(bucketStartDay('month', now)).toBe('2026-09-01')
    expect(bucketStartDay('month', new Date('2027-01-01T00:00:00Z'))).toBe(
      '2027-01-01'
    )
  })
})

describe('updatedDayFor', () => {
  const day = Schema.decodeSync(DayString)
  const wednesday = day('2026-09-23')

  it('is the day of now for day precision', () => {
    expect(
      updatedDayFor('day', wednesday, new Date('2026-09-25T10:00:00Z'))
    ).toBe('2026-09-25')
  })

  it('is the start day while the journey is in its first week', () => {
    expect(
      updatedDayFor('week', wednesday, new Date('2026-09-23T10:00:00Z'))
    ).toBe('2026-09-23')
    expect(
      updatedDayFor('week', wednesday, new Date('2026-09-27T23:59:59Z'))
    ).toBe('2026-09-23')
  })

  it('is the ISO week start from the following week on', () => {
    expect(
      updatedDayFor('week', wednesday, new Date('2026-09-28T00:00:00Z'))
    ).toBe('2026-09-28')
    expect(
      updatedDayFor('week', wednesday, new Date('2026-10-08T10:00:00Z'))
    ).toBe('2026-10-05')
  })

  it('is the week start for a journey started on a Monday', () => {
    expect(
      updatedDayFor('week', day('2026-09-21'), new Date('2026-09-24T10:00:00Z'))
    ).toBe('2026-09-21')
  })

  it('never goes before the start day when the clock moved back', () => {
    expect(
      updatedDayFor('day', wednesday, new Date('2026-09-22T10:00:00Z'))
    ).toBe('2026-09-23')
  })
})

describe('bucketDuration', () => {
  it('buckets at the hour, day and week edges', () => {
    expect(bucketDuration(0)).toBe('under1h')
    expect(bucketDuration(HOUR - 1)).toBe('under1h')
    expect(bucketDuration(HOUR)).toBe('1hTo1d')
    expect(bucketDuration(DAY - 1)).toBe('1hTo1d')
    expect(bucketDuration(DAY)).toBe('1dTo7d')
    expect(bucketDuration(7 * DAY - 1)).toBe('1dTo7d')
    expect(bucketDuration(7 * DAY)).toBe('over7d')
  })
})

describe('utcDaysBetween', () => {
  it('counts UTC calendar days, not elapsed 24h periods', () => {
    const evening = new Date('2026-03-01T22:00:00Z')
    expect(utcDaysBetween(evening, new Date('2026-03-01T23:59:00Z'))).toBe(0)
    expect(utcDaysBetween(evening, new Date('2026-03-02T08:00:00Z'))).toBe(1)
    expect(utcDaysBetween(evening, new Date('2026-03-09T00:00:00Z'))).toBe(8)
  })
})

describe('bucketDays', () => {
  it('buckets day counts', () => {
    expect(bucketDays(0)).toBe('d0')
    expect(bucketDays(1)).toBe('d1')
    expect(bucketDays(2)).toBe('d2To7')
    expect(bucketDays(7)).toBe('d2To7')
    expect(bucketDays(8)).toBe('d8Plus')
    expect(bucketDays(45)).toBe('d8Plus')
  })
})

describe('bucketOffersVisible', () => {
  it('buckets counts at the edges', () => {
    expect(bucketOffersVisible(0)).toBe('0')
    expect(bucketOffersVisible(1)).toBe('1to5')
    expect(bucketOffersVisible(5)).toBe('1to5')
    expect(bucketOffersVisible(6)).toBe('6to20')
    expect(bucketOffersVisible(20)).toBe('6to20')
    expect(bucketOffersVisible(21)).toBe('21to50')
    expect(bucketOffersVisible(50)).toBe('21to50')
    expect(bucketOffersVisible(51)).toBe('51plus')
  })
})

describe('bucketRequestCount', () => {
  it('buckets counts at the edges', () => {
    expect(bucketRequestCount(1)).toBe('1')
    expect(bucketRequestCount(2)).toBe('2to5')
    expect(bucketRequestCount(5)).toBe('2to5')
    expect(bucketRequestCount(6)).toBe('6plus')
  })
})

describe('bucketClubCount', () => {
  it('buckets counts at the edges', () => {
    expect(bucketClubCount(0)).toBe('0')
    expect(bucketClubCount(1)).toBe('1')
    expect(bucketClubCount(2)).toBe('2')
    expect(bucketClubCount(3)).toBe('3plus')
    expect(bucketClubCount(12)).toBe('3plus')
  })
})

describe('bucketTenure', () => {
  const registeredAt = new Date('2026-09-27T23:00:00Z')
  const weeksLater = (weeks: number): Date =>
    new Date(Date.parse('2026-09-21T00:00:00Z') + weeks * 7 * DAY)

  it('counts ISO weeks, not elapsed time', () => {
    expect(bucketTenure(registeredAt, new Date('2026-09-21T00:00:00Z'))).toBe(
      'w0'
    )
    expect(bucketTenure(registeredAt, new Date('2026-09-28T00:00:00Z'))).toBe(
      'w1'
    )
  })

  it('buckets weeks at the edges', () => {
    expect(bucketTenure(registeredAt, weeksLater(2))).toBe('w2to3')
    expect(bucketTenure(registeredAt, weeksLater(3))).toBe('w2to3')
    expect(bucketTenure(registeredAt, weeksLater(4))).toBe('w4')
    expect(bucketTenure(registeredAt, weeksLater(5))).toBe('w5to12')
    expect(bucketTenure(registeredAt, weeksLater(12))).toBe('w5to12')
    expect(bucketTenure(registeredAt, weeksLater(13))).toBe('w13')
    expect(bucketTenure(registeredAt, weeksLater(14))).toBe('w14plus')
  })

  it('crosses the year boundary', () => {
    expect(
      bucketTenure(
        new Date('2026-12-31T12:00:00Z'),
        new Date('2027-01-04T00:00:00Z')
      )
    ).toBe('w1')
  })

  it('is w0 when the clock moved back before registration', () => {
    expect(bucketTenure(registeredAt, weeksLater(-1))).toBe('w0')
  })
})

describe('bucketDormancy', () => {
  it('buckets whole elapsed days', () => {
    expect(bucketDormancy(30 * DAY)).toBe('d30To60')
    expect(bucketDormancy(61 * DAY - 1)).toBe('d30To60')
    expect(bucketDormancy(61 * DAY)).toBe('d61To180')
    expect(bucketDormancy(181 * DAY - 1)).toBe('d61To180')
    expect(bucketDormancy(181 * DAY)).toBe('over180')
  })
})

describe('cappedCounter', () => {
  const counter = cappedCounter(50)

  it('accepts integers within the cap', () => {
    expect(Schema.is(counter)(0)).toBe(true)
    expect(Schema.is(counter)(50)).toBe(true)
  })

  it('rejects negatives, values over the cap and non-integers', () => {
    expect(Schema.is(counter)(-1)).toBe(false)
    expect(Schema.is(counter)(51)).toBe(false)
    expect(Schema.is(counter)(1.5)).toBe(false)
  })
})
