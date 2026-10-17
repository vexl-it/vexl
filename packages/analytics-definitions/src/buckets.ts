import {Schema} from 'effect'
import {
  DayString,
  type AggregationPeriod,
  type UpdatedDayPrecision,
} from './core'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export const dayOf = (date: Date): DayString =>
  Schema.decodeSync(DayString)(date.toISOString().slice(0, 10))

export const isoWeekStart = (date: Date): DayString => {
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
  return dayOf(monday)
}

export const bucketStartDay = (
  period: AggregationPeriod,
  now: Date
): DayString => {
  if (period === 'day') return dayOf(now)
  if (period === 'week') return isoWeekStart(now)
  return dayOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
}

// Never earlier than `startDay`: the server refuses such a pair, and in the
// journey's first week the start day is already known to it.
export const updatedDayFor = (
  precision: UpdatedDayPrecision,
  startDay: DayString,
  now: Date
): DayString => {
  const day = precision === 'week' ? isoWeekStart(now) : dayOf(now)
  return day < startDay ? startDay : day
}

export const DurationBucket = Schema.Literal(
  'under1h',
  '1hTo1d',
  '1dTo7d',
  'over7d'
)
export type DurationBucket = typeof DurationBucket.Type

export const bucketDuration = (ms: number): DurationBucket => {
  if (ms < HOUR_MS) return 'under1h'
  if (ms < DAY_MS) return '1hTo1d'
  if (ms < 7 * DAY_MS) return '1dTo7d'
  return 'over7d'
}

export const DaysBucket = Schema.Literal('d0', 'd1', 'd2To7', 'd8Plus')
export type DaysBucket = typeof DaysBucket.Type

export const bucketDays = (ms: number): DaysBucket => {
  const days = Math.floor(ms / DAY_MS)
  if (days < 1) return 'd0'
  if (days < 2) return 'd1'
  if (days < 8) return 'd2To7'
  return 'd8Plus'
}

export const OffersVisibleBucket = Schema.Literal(
  '0',
  '1to5',
  '6to20',
  '21to50',
  '51plus'
)
export type OffersVisibleBucket = typeof OffersVisibleBucket.Type

export const bucketOffersVisible = (count: number): OffersVisibleBucket => {
  if (count < 1) return '0'
  if (count <= 5) return '1to5'
  if (count <= 20) return '6to20'
  if (count <= 50) return '21to50'
  return '51plus'
}

export const RequestCountBucket = Schema.Literal('1', '2to5', '6plus')
export type RequestCountBucket = typeof RequestCountBucket.Type

export const bucketRequestCount = (count: number): RequestCountBucket => {
  if (count <= 1) return '1'
  if (count <= 5) return '2to5'
  return '6plus'
}

export const ClubCountBucket = Schema.Literal('0', '1', '2', '3plus')
export type ClubCountBucket = typeof ClubCountBucket.Type

export const bucketClubCount = (count: number): ClubCountBucket => {
  if (count < 1) return '0'
  if (count < 2) return '1'
  if (count < 3) return '2'
  return '3plus'
}

export const TenureBucket = Schema.Literal(
  'w0',
  'w1',
  'w2to3',
  'w4',
  'w5to12',
  'w13',
  'w14plus'
)
export type TenureBucket = typeof TenureBucket.Type

/** ISO weeks between the registration week and the week of `now`. */
export const bucketTenure = (registeredAt: Date, now: Date): TenureBucket => {
  const weeks = Math.round(
    (Date.parse(isoWeekStart(now)) - Date.parse(isoWeekStart(registeredAt))) /
      (7 * DAY_MS)
  )
  if (weeks < 1) return 'w0'
  if (weeks < 2) return 'w1'
  if (weeks < 4) return 'w2to3'
  if (weeks < 5) return 'w4'
  if (weeks < 13) return 'w5to12'
  if (weeks < 14) return 'w13'
  return 'w14plus'
}

export const DormancyBucket = Schema.Literal('d30To60', 'd61To180', 'over180')
export type DormancyBucket = typeof DormancyBucket.Type

/** Dormancy starts at 30 days, so shorter absences fall into the first bucket. */
export const bucketDormancy = (ms: number): DormancyBucket => {
  const days = Math.floor(ms / DAY_MS)
  if (days <= 60) return 'd30To60'
  if (days <= 180) return 'd61To180'
  return 'over180'
}

export const NotificationCategory = Schema.Literal(
  'chatMessage',
  'requestReceived',
  'requestAnswered',
  'tradeReminder',
  'newOffers',
  'marketplaceReady',
  'clubAdmission',
  'clubDeactivated',
  'inactivityReminder',
  'productNews',
  'other'
)
export type NotificationCategory = typeof NotificationCategory.Type

export const AfterOpenAction = Schema.Literal(
  'offerOpened',
  'offerCreated',
  'requestSent',
  'chatOpened'
)
export type AfterOpenAction = typeof AfterOpenAction.Type

export const cappedCounter = (
  max: number
): Schema.filter<Schema.filter<typeof Schema.Number>> =>
  Schema.Int.pipe(Schema.between(0, max))
