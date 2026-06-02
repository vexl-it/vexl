import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatTime,
  normalizeFormattingLocale,
} from './formatting'

describe('normalizeFormattingLocale', () => {
  it.each([
    ['en', 'en-US'],
    ['en-GB', 'en-US'],
    ['en-US', 'en-US'],
    ['en_dev', 'en-US'],
    ['dev', 'en-US'],
  ])('normalizes %s to %s', (locale, expected) => {
    expect(normalizeFormattingLocale(locale)).toBe(expected)
  })

  it.each([
    ['ar', 'ar'],
    ['cs', 'cs'],
    ['sk', 'sk'],
    ['de', 'de'],
    ['fa', 'fa'],
    ['fi', 'fi'],
    ['fr', 'fr'],
    ['id', 'id'],
    ['no', 'no'],
    ['pcm', 'pcm'],
    ['sv', 'sv'],
    ['tr', 'tr'],
    ['uk', 'uk'],
  ])(
    'keeps supported non-English language %s unchanged',
    (locale, expected) => {
      expect(normalizeFormattingLocale(locale)).toBe(expected)
    }
  )

  it.each([undefined, '', '   ', 'unknown'])(
    'falls back safely for %s',
    (locale) => {
      expect(normalizeFormattingLocale(locale)).toBe('en-US')
    }
  )
})

describe('formatting helpers', () => {
  it('formats English decimals with en-US separators', () => {
    expect(formatDecimal(1234567.89, 'en')).toBe('1,234,567.89')
  })

  it('formats Czech decimals with locale separators', () => {
    const formatted = formatDecimal(1234567.89, 'cs')

    expect(formatted).toMatch(/^1\s234\s567,89$/)
    expect(formatted).not.toBe('1,234,567.89')
  })

  it('formats currency with an explicit currency code', () => {
    expect(formatCurrency(1, 'EUR', 'en')).toBe('€1.00')
  })

  it('formats a fixed datetime differently for en-US and Czech', () => {
    const date = new Date('2025-01-02T15:45:00.000Z')

    expect(
      formatDateTime(date, 'en-US', {timeZone: 'UTC', dateStyle: 'medium'})
    ).not.toBe(
      formatDateTime(date, 'cs', {timeZone: 'UTC', dateStyle: 'medium'})
    )
  })

  it('formats dates with explicit components', () => {
    const date = new Date('2025-01-02T15:45:00.000Z')

    expect(() =>
      formatDate(date, 'en-US', {
        timeZone: 'UTC',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    ).not.toThrow()
  })

  it('formats times with explicit components', () => {
    const date = new Date('2025-01-02T15:45:00.000Z')

    expect(() =>
      formatTime(date, 'en-US', {
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
      })
    ).not.toThrow()
  })

  it('formats datetimes with explicit components', () => {
    const date = new Date('2025-01-02T15:45:00.000Z')

    expect(() =>
      formatDateTime(date, 'en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    ).not.toThrow()
  })
})
