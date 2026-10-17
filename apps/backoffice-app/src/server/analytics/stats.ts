import {
  formatValue,
  MIN_GROUP_SIZE,
  type SeriesPoint,
} from '@/src/services/analytics/domain'
import {Array, Option, pipe} from 'effect'
import {type Bucket} from './buckets'

// Every number leaves the server through these: groups smaller than
// MIN_GROUP_SIZE become null, shown as "<20" or "n/a".
export const countOrNull = (count: number): number | null =>
  count < MIN_GROUP_SIZE ? null : Math.round(count)

export const percentOrNull = (part: number, whole: number): number | null =>
  whole < MIN_GROUP_SIZE || (part > 0 && part < MIN_GROUP_SIZE)
    ? null
    : (part / whole) * 100

// A null part does not apply to the group and shows as —
export const shareRow = (
  label: string,
  installs: number,
  parts: ReadonlyArray<number | null>
): string[] => [
  label,
  formatValue.count(countOrNull(installs)),
  ...Array.map(parts, (part) =>
    part === null ? '—' : formatValue.pct(percentOrNull(part, installs))
  ),
]

// Share in % per category, under the series key 'share'
export const distribution = (
  items: ReadonlyArray<readonly [string, number]>,
  whole: number
): readonly SeriesPoint[] =>
  Array.map(items, ([label, part]) => ({
    label,
    provisional: false,
    values: {share: percentOrNull(part, whole)},
  }))

export const seriesOf = (
  buckets: readonly Bucket[],
  valuesFor: (bucket: Bucket) => Record<string, number | null>
): readonly SeriesPoint[] =>
  Array.map(buckets, (bucket) => ({
    label: bucket.label,
    provisional: bucket.provisional,
    values: valuesFor(bucket),
  }))

export const inBucket =
  (bucket: Bucket) =>
  (row: {readonly bucket: string | null}): boolean =>
    row.bucket === bucket.startDay

export const lastSettled = (
  points: readonly SeriesPoint[],
  key: string
): {label: string; value: number | null} =>
  pipe(
    points,
    Array.findLast((point) => !point.provisional),
    Option.map((point) => ({
      label: point.label,
      value: point.values[key] ?? null,
    })),
    Option.getOrElse(() => ({label: '', value: null}))
  )
