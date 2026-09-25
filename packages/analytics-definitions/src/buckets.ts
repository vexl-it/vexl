import {Schema} from 'effect'
import {DayString} from './core'

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

export const DaysBucket = Schema.Literal('d0', 'd1', 'd2To7', 'd8To30')
export type DaysBucket = typeof DaysBucket.Type

export const bucketDays = (ms: number): DaysBucket => {
  const days = Math.floor(ms / DAY_MS)
  if (days < 1) return 'd0'
  if (days < 2) return 'd1'
  if (days < 8) return 'd2To7'
  return 'd8To30'
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

export const cappedCounter = (
  max: number
): Schema.filter<Schema.filter<typeof Schema.Number>> =>
  Schema.Int.pipe(Schema.between(0, max))
