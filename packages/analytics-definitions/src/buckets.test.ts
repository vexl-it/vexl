import {Schema} from 'effect'
import {describe, expect, it} from 'vitest'
import {
  bucketDays,
  bucketDuration,
  bucketOffersVisible,
  cappedCounter,
  dayOf,
  isoWeekStart,
} from './buckets'

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

describe('bucketDays', () => {
  it('buckets whole elapsed days', () => {
    expect(bucketDays(0)).toBe('d0')
    expect(bucketDays(DAY - 1)).toBe('d0')
    expect(bucketDays(DAY)).toBe('d1')
    expect(bucketDays(2 * DAY - 1)).toBe('d1')
    expect(bucketDays(2 * DAY)).toBe('d2To7')
    expect(bucketDays(8 * DAY - 1)).toBe('d2To7')
    expect(bucketDays(8 * DAY)).toBe('d8To30')
    expect(bucketDays(45 * DAY)).toBe('d8To30')
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
