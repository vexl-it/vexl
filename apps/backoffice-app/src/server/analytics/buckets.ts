import {
  rangeShown,
  type AnalyticsFilters,
  type JourneyCohorts,
  type Period,
  type Range,
} from '@/src/services/analytics/domain'
import {dayOf} from '@vexl-next/analytics-definitions/src/buckets'
import {
  analyticsStateMaxAgeDays,
  defaultAnalyticsWindow,
  type AnalyticsRetentionShape,
  type DayString,
} from '@vexl-next/analytics-definitions/src/core'
import {Array, Option, pipe} from 'effect'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

// 'all' is the raw-row retention (docs/analytics/system.md §4.4)
const RANGE_DAYS: Record<Range, number> = {
  '3m': 90,
  '6m': 182,
  '12m': 365,
  all: 540,
}

// When a bucket's numbers are final: backend counters once the bucket is
// over, client rows once the server stops accepting uploads for them.
export type Maturity = AnalyticsRetentionShape | 'backend'

export const journeyWaitDays = (lifetimeDays: number): number =>
  analyticsStateMaxAgeDays(
    {kind: 'journey', lifetimeDays},
    defaultAnalyticsWindow
  )

export interface Bucket {
  readonly label: string
  readonly provisional: boolean
  readonly startDay: DayString
  // Exclusive
  readonly endDay: DayString
}

export type BucketWindow = Pick<AnalyticsFilters, 'period' | 'range'>

const todayMs = (): number => {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

export const today = (): DayString => dayOf(new Date(todayMs()))

const toDay = (ms: number): DayString => dayOf(new Date(ms))

export const addDays = (day: DayString, days: number): DayString =>
  toDay(Date.parse(day) + days * DAY_MS)

export const isFinal = (
  maturity: Maturity,
  startDay: DayString,
  endDay: DayString
): boolean => isFinalMs(maturity, Date.parse(startDay), Date.parse(endDay))

const isFinalMs = (
  maturity: Maturity,
  startMs: number,
  endMs: number
): boolean => {
  if (maturity === 'backend') return endMs <= todayMs()
  // A journey may start on the bucket's last day, an aggregation row only on
  // the bucket's first
  const lastStartMs = maturity.kind === 'journey' ? endMs - DAY_MS : startMs
  return (
    todayMs() - lastStartMs >
    analyticsStateMaxAgeDays(maturity, defaultAnalyticsWindow) * DAY_MS
  )
}

const yearOf = (ms: number): number => new Date(ms).getUTCFullYear()

const shortYear = (ms: number): string => `'${String(yearOf(ms) % 100)}`

// The year is shown only outside the current one
export const formatDay = (ms: number): string => {
  const day = new Date(ms).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return yearOf(ms) === yearOf(todayMs()) ? day : `${day} ${shortYear(ms)}`
}

const weekStartMs = (ms: number): number => {
  const weekday = (new Date(ms).getUTCDay() + 6) % 7
  return ms - weekday * DAY_MS
}

const MONTHS_PER: Record<'month' | 'quarter', number> = {month: 1, quarter: 3}

// The bucket `back` buckets before the current one
const bucketSpan = (
  period: Period,
  back: number
): {startMs: number; endMs: number} => {
  if (period === 'day' || period === 'week') {
    const length = period === 'day' ? DAY_MS : WEEK_MS
    const current = period === 'day' ? todayMs() : weekStartMs(todayMs())
    const startMs = current - back * length
    return {startMs, endMs: startMs + length}
  }
  const months = MONTHS_PER[period]
  const now = new Date(todayMs())
  const firstMonth =
    now.getUTCMonth() - (now.getUTCMonth() % months) - back * months
  return {
    startMs: Date.UTC(now.getUTCFullYear(), firstMonth),
    endMs: Date.UTC(now.getUTCFullYear(), firstMonth + months),
  }
}

const bucketLabel = (period: Period, startMs: number): string => {
  if (period === 'day' || period === 'week') return formatDay(startMs)
  const date = new Date(startMs)
  if (period === 'quarter')
    return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${shortYear(startMs)}`
  return date.toLocaleDateString('en', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

const rangeStartMs = (range: Range): number =>
  todayMs() + DAY_MS - RANGE_DAYS[range] * DAY_MS

export const rangeStartDay = (range: Range): DayString =>
  toDay(rangeStartMs(range))

// Buckets mostly inside the range (so a quarter still shows for 3 months),
// oldest first, never older than the raw-row retention
export const bucketsOf = (
  window: BucketWindow,
  maturity: Maturity
): readonly Bucket[] => {
  const startMs = rangeStartMs(rangeShown(window))
  const retentionStartMs = rangeStartMs('all')
  return pipe(
    Array.makeBy(RANGE_DAYS.all, (back) => bucketSpan(window.period, back)),
    Array.takeWhile((span) => (span.startMs + span.endMs) / 2 > startMs),
    Array.filter((span) => span.startMs >= retentionStartMs),
    Array.reverse,
    Array.map((span) => ({
      label: bucketLabel(window.period, span.startMs),
      provisional: !isFinalMs(maturity, span.startMs, span.endMs),
      startDay: toDay(span.startMs),
      endDay: toDay(span.endMs),
    }))
  )
}

export const finalBuckets = (buckets: readonly Bucket[]): readonly Bucket[] =>
  Array.filter(buckets, (bucket) => !bucket.provisional)

export const lastFinalWeek = (maturity: Maturity): Option.Option<Bucket> =>
  Array.last(finalBuckets(bucketsOf({period: 'week', range: '3m'}, maturity)))

// Days covered by a list of buckets, for the WHERE clause of their query
export interface DayRange {
  readonly from: DayString
  readonly to: DayString
}

export const daysOf = (buckets: readonly Bucket[]): DayRange | undefined =>
  Array.isNonEmptyReadonlyArray(buckets)
    ? {
        from: Array.reduce(buckets, buckets[0].startDay, (from, bucket) =>
          bucket.startDay < from ? bucket.startDay : from
        ),
        to: Array.reduce(buckets, buckets[0].endDay, (to, bucket) =>
          bucket.endDay > to ? bucket.endDay : to
        ),
      }
    : undefined

// A snapshot adds up the journeys started in the range's final weeks
export interface Snapshot {
  readonly cohorts: JourneyCohorts
  readonly days: DayRange | undefined
}

export const snapshotOf = (
  range: Range,
  subject: string,
  lifetimeDays: number
): Snapshot => {
  const weeks = finalBuckets(
    bucketsOf({period: 'week', range}, {kind: 'journey', lifetimeDays})
  )
  return {
    cohorts: {
      subject,
      waitDays: journeyWaitDays(lifetimeDays),
      span: Array.isNonEmptyReadonlyArray(weeks)
        ? `${Array.headNonEmpty(weeks).label} – ${Array.lastNonEmpty(weeks).label}`
        : null,
    },
    days: daysOf(weeks),
  }
}

export const formatSpan = (range: Range): string =>
  `${formatDay(rangeStartMs(range))} – ${formatDay(todayMs())}`

// The ISO weeks starting in a bucket
export const mondaysIn = (bucket: Bucket): readonly DayString[] => {
  const weekday = new Date(bucket.startDay).getUTCDay()
  return Array.unfold(addDays(bucket.startDay, (8 - weekday) % 7), (monday) =>
    monday < bucket.endDay
      ? Option.some([monday, addDays(monday, 7)])
      : Option.none()
  )
}
