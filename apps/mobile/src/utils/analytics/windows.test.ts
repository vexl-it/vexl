import {Option} from 'effect'
import {
  coreActionWindow,
  dormancyOnReturn,
  isWithinActivationWindow,
} from './windows'

const DAY_MS = 24 * 60 * 60 * 1000
// Late in the UTC day, so the windows are counted in days, not in 24 h spans.
const registeredAt = Date.parse('2026-09-21T23:30:00Z')
const daysAfterRegistrationDay = (days: number, time = '00:10:00'): Date =>
  new Date(
    `${new Date(Date.parse('2026-09-21') + days * DAY_MS).toISOString().slice(0, 10)}T${time}Z`
  )

describe('isWithinActivationWindow', () => {
  it('accepts core actions up to 30 days after registration', () => {
    expect(
      isWithinActivationWindow(
        registeredAt,
        new Date(registeredAt + 30 * DAY_MS - 1)
      )
    ).toBe(true)
    expect(
      isWithinActivationWindow(
        registeredAt,
        new Date(registeredAt + 30 * DAY_MS)
      )
    ).toBe(false)
  })
})

describe('coreActionWindow', () => {
  it.each([
    [0, Option.none()],
    [1, Option.some('coreActionD1')],
    [2, Option.none()],
    [6, Option.none()],
    [7, Option.some('coreActionD7')],
    [13, Option.some('coreActionD7')],
    [14, Option.none()],
    [27, Option.none()],
    [28, Option.some('coreActionD30')],
    [34, Option.some('coreActionD30')],
    [35, Option.none()],
  ])('day %i after the registration day is %o', (days, expected) => {
    expect(
      coreActionWindow(registeredAt, daysAfterRegistrationDay(days))
    ).toEqual(expected)
  })

  it('counts UTC calendar days, not 24 hour spans', () => {
    expect(
      coreActionWindow(registeredAt, daysAfterRegistrationDay(1, '23:59:00'))
    ).toEqual(Option.some('coreActionD1'))
  })
})

describe('dormancyOnReturn', () => {
  const now = new Date('2026-10-17T12:00:00Z')
  const away = (days: number): number => now.getTime() - days * DAY_MS

  it('is no return without a previous foreground', () => {
    expect(dormancyOnReturn(undefined, now)).toEqual(Option.none())
  })

  it('is no return before 30 days away', () => {
    expect(dormancyOnReturn(away(30) + 1, now)).toEqual(Option.none())
  })

  it.each([
    [30, 'd30To60'],
    [60, 'd30To60'],
    [61, 'd61To180'],
    [181, 'over180'],
  ])('buckets %i days away as %s', (days, bucket) => {
    expect(dormancyOnReturn(away(days), now)).toEqual(Option.some(bucket))
  })
})
