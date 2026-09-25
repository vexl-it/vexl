import {dayOf} from '@vexl-next/analytics-definitions/src/buckets'
import {type DayString} from '@vexl-next/analytics-definitions/src/core'
import {type VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Clock, Effect, Option, pipe, Schema, String} from 'effect'

const DAY_MS = 24 * 60 * 60 * 1000

export const ANALYTICS_BODY_SIZE_LIMIT_BYTES = 4096

export class AnalyticsDayRuleError extends Schema.TaggedError<AnalyticsDayRuleError>(
  'AnalyticsDayRuleError'
)('AnalyticsDayRuleError', {
  rule: Schema.Literal(
    'malformedDay',
    'updatedBeforeStart',
    'updatedDayInFuture',
    'stale'
  ),
}) {}

const dayToMs = (day: DayString): Option.Option<number> => {
  const ms = Date.parse(`${day}T00:00:00Z`)
  return Number.isNaN(ms) || dayOf(new Date(ms)) !== day
    ? Option.none()
    : Option.some(ms)
}

export const todayDay: Effect.Effect<DayString> = Clock.currentTimeMillis.pipe(
  Effect.map((ms) => dayOf(new Date(ms)))
)

export const checkAnalyticsStateDays = ({
  startDay,
  updatedDay,
  today,
  maxAgeDays,
}: {
  startDay: DayString
  updatedDay: DayString
  today: DayString
  maxAgeDays: number
}): Effect.Effect<void, AnalyticsDayRuleError> =>
  Effect.gen(function* (_) {
    const fail = (rule: AnalyticsDayRuleError['rule']): AnalyticsDayRuleError =>
      new AnalyticsDayRuleError({rule})

    const start = yield* _(
      dayToMs(startDay),
      Effect.mapError(() => fail('malformedDay'))
    )
    const updated = yield* _(
      dayToMs(updatedDay),
      Effect.mapError(() => fail('malformedDay'))
    )
    const now = yield* _(
      dayToMs(today),
      Effect.mapError(() => fail('malformedDay'))
    )

    if (updated < start) return yield* _(fail('updatedBeforeStart'))
    if (updated > now + DAY_MS) return yield* _(fail('updatedDayInFuture'))
    if (now - start > maxAgeDays * DAY_MS) return yield* _(fail('stale'))
  })

export const releaseLineOf = (semver: Option.Option<VersionString>): string =>
  pipe(
    semver,
    Option.map((v) =>
      pipe(String.split(v, '.'), Array.take(2), Array.join('.'))
    ),
    Option.getOrElse(() => 'unknown')
  )

export const countryPrefixColumnOf = (
  storeCountry: boolean,
  prefix: Option.Option<number>
): string =>
  storeCountry
    ? pipe(
        prefix,
        Option.map((p) => `${p}`),
        Option.getOrElse(() => 'none')
      )
    : 'none'
