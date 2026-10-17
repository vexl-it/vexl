import {
  MIN_GROUP_SIZE,
  uniquePeriodOf,
  type ActivityData,
  type SeriesPoint,
} from '@/src/services/analytics/domain'
import {type CoreActivity} from '@vexl-next/analytics-definitions/src/coreAction'
import {activityDailyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityDaily'
import {activityMonthlyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityMonthly'
import {activityWeeklyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {Array, Effect, Option, pipe} from 'effect'
import {
  addDays,
  bucketsOf,
  daysOf,
  finalBuckets,
  isFinal,
  lastFinalWeek,
  mondaysIn,
  type Bucket,
} from './buckets'
import {
  countStates,
  gaugeMetric,
  sumValues,
  sumWhere,
  type QueryResult,
  type QueryScope,
  type StateCount,
} from './query'
import {
  countOrNull,
  distribution,
  inBucket,
  lastSettled,
  percentOrNull,
  seriesOf,
} from './stats'

const hasCoreAction = (state: CoreActivity): boolean =>
  state.coreActionMain === true || state.coreActionClub === true

// Main only / Club only / both are exclusive, so they stack to "opened"
const activeSeries = (
  buckets: readonly Bucket[],
  rows: ReadonlyArray<StateCount<CoreActivity>>
): readonly SeriesPoint[] =>
  seriesOf(buckets, (bucket) => {
    const bucketRows = Array.filter(rows, inBucket(bucket))
    const count = (predicate: (state: CoreActivity) => boolean): number =>
      sumWhere(bucketRows, (row) => predicate(row.state))
    return {
      opened: countOrNull(count(() => true)),
      core: countOrNull(count(hasCoreAction)),
      openedOnly: countOrNull(count((state) => !hasCoreAction(state))),
      mainOnly: countOrNull(
        count((state) => state.coreActionMain === true && !state.coreActionClub)
      ),
      clubOnly: countOrNull(
        count((state) => state.coreActionClub === true && !state.coreActionMain)
      ),
      both: countOrNull(
        count(
          (state) =>
            state.coreActionMain === true && state.coreActionClub === true
        )
      ),
    }
  })

const average = (total: number, installs: number): string =>
  installs < MIN_GROUP_SIZE ? 'n/a' : (total / installs).toFixed(2)

export const loadActivity = (scope: QueryScope): QueryResult<ActivityData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    const dayBuckets = bucketsOf(
      {period: 'day', range: filters.range},
      activityDailyAggregation
    )
    const weekBuckets = bucketsOf(
      {period: 'week', range: filters.range},
      activityWeeklyAggregation
    )
    const monthBuckets = bucketsOf(
      {period: 'month', range: filters.range},
      activityMonthlyAggregation
    )
    const lastWeek = lastFinalWeek(activityWeeklyAggregation)
    const backendWeeks = bucketsOf(
      {period: 'week', range: filters.range},
      'backend'
    )
    const coreActivity = {
      daily: activityDailyAggregation.payloadSchema.pick(
        'coreActionMain',
        'coreActionClub'
      ),
      weekly: activityWeeklyAggregation.payloadSchema.pick(
        'coreActionMain',
        'coreActionClub'
      ),
      monthly: activityMonthlyAggregation.payloadSchema.pick(
        'coreActionMain',
        'coreActionClub'
      ),
    }

    const data = yield* _(
      Effect.all(
        {
          daily: countStates(activityDailyAggregation.name, {
            state: coreActivity.daily,
            days: daysOf(dayBuckets),
            period: 'day',
            scope,
          }),
          weekly: countStates(activityWeeklyAggregation.name, {
            state: coreActivity.weekly,
            sums: activityWeeklyAggregation.payloadSchema.pick('offersOpened'),
            // Stickiness also needs the weeks starting in the first month
            days: daysOf([...weekBuckets, ...monthBuckets]),
            period: 'week',
            scope,
          }),
          monthly: countStates(activityMonthlyAggregation.name, {
            state: coreActivity.monthly,
            days: daysOf(monthBuckets),
            period: 'month',
            scope,
          }),
          lastWeekRows: countStates(activityWeeklyAggregation.name, {
            state: activityWeeklyAggregation.payloadSchema.pick(
              'activeDays',
              'coreActionMain',
              'coreActionClub'
            ),
            sums: activityWeeklyAggregation.payloadSchema.pick(
              'offersCreated',
              'requestsSent',
              'requestsApproved'
            ),
            days: Option.getOrUndefined(
              Option.map(lastWeek, (week) => daysOf([week]))
            ),
            scope,
          }),
          backendActive: gaugeMetric({
            names: ['COUNT_OF_ACTIVE_USERS_BY_COUNTRY'],
            pick: 'last',
            days: daysOf(backendWeeks),
            period: 'week',
            country: 'countryPrefix',
            scope,
          }),
        },
        {concurrency: 'unbounded'}
      )
    )

    const daily = activeSeries(dayBuckets, data.daily)
    const weekly = activeSeries(weekBuckets, data.weekly)
    const monthly = activeSeries(monthBuckets, data.monthly)

    const offersOpened = seriesOf(weekBuckets, (bucket) => {
      const rows = Array.filter(data.weekly, inBucket(bucket))
      const installs = sumWhere(rows, () => true)
      const opens = pipe(
        rows,
        Array.reduce(0, (sum, row) => sum + (row.sums.offersOpened ?? 0))
      )
      return installs < MIN_GROUP_SIZE
        ? {opens: null, perInstall: null}
        : {opens, perInstall: Math.round((opens / installs) * 10) / 10}
    })

    // Average weekly active installs of the ISO weeks starting in the month,
    // divided by that month's monthly active installs
    const stickiness = Array.filterMap(finalBuckets(monthBuckets), (month) => {
      const weeks = mondaysIn(month)
      const weekRows = Array.filter(data.weekly, (row) =>
        Array.contains(weeks, row.bucket)
      )
      const monthRows = Array.filter(data.monthly, inBucket(month))
      const weeklyFinal = Array.every(weeks, (monday) =>
        isFinal(activityWeeklyAggregation, monday, addDays(monday, 7))
      )
      if (!weeklyFinal || !Array.isNonEmptyReadonlyArray(weeks))
        return Option.none()
      const averageWeekly = (
        predicate: (state: CoreActivity) => boolean
      ): number =>
        sumWhere(weekRows, (row) => predicate(row.state)) / weeks.length
      const monthlyCount = (
        predicate: (state: CoreActivity) => boolean
      ): number => sumWhere(monthRows, (row) => predicate(row.state))
      return Option.some({
        label: month.label,
        provisional: false,
        values: {
          opened: percentOrNull(
            averageWeekly(() => true),
            monthlyCount(() => true)
          ),
          core: percentOrNull(
            averageWeekly(hasCoreAction),
            monthlyCount(hasCoreAction)
          ),
        },
      })
    })

    const activeInstalls = sumWhere(
      data.lastWeekRows,
      (row) => (row.state.activeDays ?? 0) > 0
    )
    const coreRows = Array.filter(data.lastWeekRows, (row) =>
      hasCoreAction(row.state)
    )
    const coreInstalls = sumWhere(coreRows, () => true)
    const coreTotal = (key: string): number =>
      pipe(
        coreRows,
        Array.reduce(0, (sum, row) => sum + (row.sums[key] ?? 0))
      )

    return {
      tiles: {
        day: lastSettled(daily, 'opened'),
        week: lastSettled(weekly, 'opened'),
        month: lastSettled(monthly, 'opened'),
        dayCore: lastSettled(daily, 'core'),
        weekCore: lastSettled(weekly, 'core'),
        monthCore: lastSettled(monthly, 'core'),
      },
      actives: {day: daily, week: weekly, month: monthly}[
        uniquePeriodOf(filters.period)
      ],
      offersOpened,
      stickiness,
      lastSettledWeek: Option.match(lastWeek, {
        onNone: () => '',
        onSome: (week) => week.label,
      }),
      activeDays: distribution(
        Array.makeBy(7, (index): readonly [string, number] => [
          String(index + 1),
          sumWhere(
            data.lastWeekRows,
            (row) => row.state.activeDays === index + 1
          ),
        ]),
        activeInstalls
      ),
      actionsPerInstall: {
        headers: ['Action', 'Average per install'],
        rows: [
          ['Offers created', average(coreTotal('offersCreated'), coreInstalls)],
          ['Requests sent', average(coreTotal('requestsSent'), coreInstalls)],
          [
            'Requests approved',
            average(coreTotal('requestsApproved'), coreInstalls),
          ],
        ],
      },
      backendActive30d: seriesOf(backendWeeks, (bucket) => ({
        users: countOrNull(sumValues(data.backendActive, inBucket(bucket))),
      })),
    }
  })
