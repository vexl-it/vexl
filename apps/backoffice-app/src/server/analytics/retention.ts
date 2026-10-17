import {
  formatValue,
  type CohortCell,
  type CohortData,
  type RetentionData,
} from '@/src/services/analytics/domain'
import {
  type AfterOpenAction,
  type DormancyBucket,
  type TenureBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {activityWeeklyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {onboardingJourney} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {
  reactivationJourney,
  type ReactivationSource,
  type ReactivationState,
} from '@vexl-next/analytics-definitions/src/definitions/reactivation'
import {Array, Effect, Option, pipe} from 'effect'
import {
  addDays,
  bucketsOf,
  daysOf,
  isFinal,
  mondaysIn,
  snapshotOf,
  today,
} from './buckets'
import {isNewRegistration, onboardingSnapshot} from './funnel'
import {
  countStates,
  gaugeMetric,
  sumMetric,
  sumValues,
  sumWhere,
  type QueryResult,
  type QueryScope,
} from './query'
import {
  countOrNull,
  distribution,
  inBucket,
  percentOrNull,
  seriesOf,
  shareRow,
} from './stats'

// [column, ISO weeks after the registration week, core action kind]
const RETENTION_COLUMNS: ReadonlyArray<
  readonly [string, number, 'coreActionMain' | 'coreActionClub']
> = [
  ['Main · W1', 1, 'coreActionMain'],
  ['Main · W4', 4, 'coreActionMain'],
  ['Main · W13', 13, 'coreActionMain'],
  ['Clubs · W1', 1, 'coreActionClub'],
  ['Clubs · W4', 4, 'coreActionClub'],
  ['Clubs · W13', 13, 'coreActionClub'],
]

const TENURE_OF_WEEK: Readonly<Record<number, TenureBucket>> = {
  0: 'w0',
  1: 'w1',
  4: 'w4',
  13: 'w13',
}

const RETURN_ENTRIES: ReadonlyArray<readonly [string, ReactivationSource]> = [
  ['Opened the app directly', 'direct'],
  ['Inactivity reminder', 'inactivityReminder'],
  ['Chat message', 'chatMessage'],
  ['Request received', 'requestReceived'],
  ['Request answered', 'requestAnswered'],
  ['Trade reminder', 'tradeReminder'],
  ['New offers', 'newOffers'],
  ['Marketplace ready', 'marketplaceReady'],
  ['Club admission', 'clubAdmission'],
  ['Club deactivated', 'clubDeactivated'],
  ['Product news', 'productNews'],
  ['Other', 'other'],
]

const FIRST_ACTIONS: ReadonlyArray<
  readonly [string, AfterOpenAction | undefined]
> = [
  ['Only opened the app', undefined],
  ['Opened an offer', 'offerOpened'],
  ['Sent a request', 'requestSent'],
  ['Created an offer', 'offerCreated'],
  ['Opened a chat', 'chatOpened'],
]

const DORMANT_FOR: ReadonlyArray<readonly [string, DormancyBucket]> = [
  ['30–60 days', 'd30To60'],
  ['61–180 days', 'd61To180'],
  ['Over 180 days', 'over180'],
]

const REACTIVATED_AFTER_DAYS = {daysInactive: 30}

// The D30 window (days 28 to 34) fits the 37-day journey only for installs
// that registered at most 2 days after first open
const d30Unknown = (state: {registeredAfter?: string}): boolean =>
  state.registeredAfter === 'd2To7' || state.registeredAfter === 'd8Plus'

export const loadRetention = (scope: QueryScope): QueryResult<RetentionData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    // Tenure is counted in weeks, so the finest cohort is a registration week
    const cohortPeriod = filters.period === 'day' ? 'week' : filters.period
    const cohortBuckets = bucketsOf(
      {period: cohortPeriod, range: filters.range},
      activityWeeklyAggregation
    )
    const registrationSnapshot = onboardingSnapshot(scope)
    const reactivationSnapshot = snapshotOf(
      filters.range,
      'returns after 30+ days away',
      reactivationJourney.lifetimeDays
    )
    const reactivationBuckets = bucketsOf(filters, reactivationJourney)
    const backendWeeks = bucketsOf(
      {period: 'week', range: filters.range},
      'backend'
    )
    const backendBuckets = bucketsOf(filters, 'backend')
    const allUsers: QueryScope = {
      ...scope,
      filters: {...filters, country: 'all', platform: 'all'},
    }

    const data = yield* _(
      Effect.all(
        {
          weekly: countStates(activityWeeklyAggregation.name, {
            state: activityWeeklyAggregation.payloadSchema.pick(
              'tenure',
              'coreActionMain',
              'coreActionClub'
            ),
            days: pipe(
              daysOf(cohortBuckets),
              (days) => days && {from: days.from, to: addDays(today(), 1)}
            ),
            period: 'week',
            scope,
          }),
          onboarding: countStates(onboardingJourney.name, {
            state: onboardingJourney.payloadSchema.pick(
              'step',
              'existingAccount',
              'activation',
              'activatedAfter',
              'clubJoin',
              'registeredAfter',
              'coreActionD1',
              'coreActionD7',
              'coreActionD30'
            ),
            days: registrationSnapshot.days,
            scope,
          }),
          dormant: gaugeMetric({
            names: ['COUNT_OF_INACTIVE_USERS'],
            pick: 'last',
            days: daysOf(backendWeeks),
            period: 'week',
          }),
          dormantAtWeekStart: gaugeMetric({
            names: ['COUNT_OF_INACTIVE_USERS'],
            pick: 'first',
            days: daysOf(backendWeeks),
            period: 'week',
          }),
          weeklyReturns: sumMetric({
            name: 'USER_REACTIVATED',
            atLeast: REACTIVATED_AFTER_DAYS,
            days: daysOf(backendWeeks),
            period: 'week',
            dimensions: {},
            scope: allUsers,
          }),
          returns: sumMetric({
            name: 'USER_REACTIVATED',
            atLeast: REACTIVATED_AFTER_DAYS,
            days: daysOf(backendBuckets),
            period: filters.period,
            dimensions: {
              country: 'clientCountryPrefix',
              platform: 'appPlatform',
            },
            scope,
          }),
          reactivations: countStates(reactivationJourney.name, {
            state: reactivationJourney.payloadSchema.pick('coreAction'),
            days: daysOf(reactivationBuckets),
            period: filters.period,
            scope,
          }),
          returnRows: countStates(reactivationJourney.name, {
            state: reactivationJourney.payloadSchema.pick(
              'openedFrom',
              'coreAction',
              'firstAction',
              'dormantFor',
              'clubMember'
            ),
            days: reactivationSnapshot.days,
            scope,
          }),
        },
        {concurrency: 'unbounded'}
      )
    )

    const weeklyCount = (
      monday: string,
      tenure: TenureBucket,
      predicate: (state: {
        coreActionMain?: boolean
        coreActionClub?: boolean
      }) => boolean
    ): number =>
      sumWhere(
        data.weekly,
        (row) =>
          row.bucket === monday &&
          row.state.tenure === tenure &&
          predicate(row.state)
      )

    // Coarser cohorts add up their registration weeks
    const cohort: CohortData = {
      rowHeader: `Registration ${cohortPeriod}`,
      columns: Array.map(RETENTION_COLUMNS, ([column]) => column),
      rows: Array.map(cohortBuckets, (bucket) => {
        const weeks = mondaysIn(bucket)
        const registered = pipe(
          weeks,
          Array.reduce(
            0,
            (sum, monday) => sum + weeklyCount(monday, 'w0', () => true)
          )
        )
        const lastWeek = pipe(
          Array.last(weeks),
          Option.getOrElse(() => bucket.startDay)
        )
        return {
          label: bucket.label,
          values: Array.map(
            RETENTION_COLUMNS,
            ([, weeksAfter, kind]): CohortCell => {
              const targetWeek = addDays(lastWeek, weeksAfter * 7)
              if (
                !isFinal(
                  activityWeeklyAggregation,
                  targetWeek,
                  addDays(targetWeek, 7)
                )
              )
                return 'pending'
              const retained = pipe(
                weeks,
                Array.reduce(
                  0,
                  (sum, monday) =>
                    sum +
                    weeklyCount(
                      addDays(monday, weeksAfter * 7),
                      TENURE_OF_WEEK[weeksAfter],
                      (state) => state[kind] === true
                    )
                )
              )
              return percentOrNull(retained, registered)
            }
          ),
        }
      }),
    }

    const registrations = Array.filter(data.onboarding, (row) =>
      isNewRegistration(row.state)
    )
    const dayRetentionRow = (
      label: string,
      predicate: (state: (typeof registrations)[number]['state']) => boolean
    ): string[] => {
      const rows = Array.filter(registrations, (row) => predicate(row.state))
      const installs = sumWhere(rows, () => true)
      const unknown = sumWhere(rows, (row) => d30Unknown(row.state))
      return [
        label,
        formatValue.count(countOrNull(installs)),
        formatValue.pct(
          percentOrNull(
            sumWhere(rows, (row) => row.state.coreActionD1 === true),
            installs
          )
        ),
        formatValue.pct(
          percentOrNull(
            sumWhere(rows, (row) => row.state.coreActionD7 === true),
            installs
          )
        ),
        formatValue.pct(
          percentOrNull(
            sumWhere(
              rows,
              (row) =>
                row.state.coreActionD30 === true && !d30Unknown(row.state)
            ),
            installs - unknown
          )
        ),
        formatValue.pct(percentOrNull(unknown, installs)),
      ]
    }
    const activatedOnRegistrationDay = (state: {
      activation?: string
      activatedAfter?: string
    }): boolean =>
      state.activation !== undefined && state.activatedAfter === 'd0'
    const joinedClubFirst = (state: {clubJoin?: string}): boolean =>
      state.clubJoin === 'beforeContactsImport'

    const returns = data.returnRows
    const returnsWhere = (
      predicate: (state: Partial<ReactivationState>) => boolean
    ): number => sumWhere(returns, (row) => predicate(row.state))
    const allReturns = returnsWhere(() => true)
    const returnsRow = (
      label: string,
      predicate: (state: Partial<ReactivationState>) => boolean
    ): string[] =>
      shareRow(label, returnsWhere(predicate), [
        returnsWhere((state) => predicate(state) && state.coreAction === true),
      ])

    return {
      cohort,
      cohortPeriod,
      registrationCohorts: registrationSnapshot.cohorts,
      reactivationCohorts: reactivationSnapshot.cohorts,
      dayRetention: {
        headers: [
          'Group',
          'New registrations',
          'D1',
          'D7',
          'D30',
          'D30 unknown',
        ],
        rows: [
          dayRetentionRow('All new registrations', () => true),
          dayRetentionRow(
            'Activated on registration day',
            activatedOnRegistrationDay
          ),
          dayRetentionRow(
            'Not activated on registration day',
            (state) => !activatedOnRegistrationDay(state)
          ),
          dayRetentionRow(
            'Joined a Club before importing contacts',
            joinedClubFirst
          ),
          dayRetentionRow(
            "Didn't join a Club before importing contacts",
            (state) => !joinedClubFirst(state)
          ),
        ],
      },
      reactivations: seriesOf(reactivationBuckets, (bucket) => {
        const rows = Array.filter(data.reactivations, inBucket(bucket))
        const returned = sumWhere(rows, () => true)
        const withCoreAction = sumWhere(
          rows,
          (row) => row.state.coreAction === true
        )
        return {
          returned: countOrNull(returned),
          withCoreAction: countOrNull(withCoreAction),
          share: percentOrNull(withCoreAction, returned),
        }
      }),
      dormantPool: seriesOf(backendWeeks, (bucket) => ({
        users: countOrNull(sumValues(data.dormant, inBucket(bucket))),
      })),
      backendReturns: seriesOf(backendBuckets, (bucket) => ({
        users: countOrNull(sumValues(data.returns, inBucket(bucket))),
      })),
      // Returns in the week over the dormant pool at its start, both all users
      reactivationRate: seriesOf(backendWeeks, (bucket) => ({
        rate: percentOrNull(
          sumValues(data.weeklyReturns, inBucket(bucket)),
          sumValues(data.dormantAtWeekStart, inBucket(bucket))
        ),
      })),
      firstActionAfterReturn: distribution(
        Array.map(
          FIRST_ACTIONS,
          ([label, action]): readonly [string, number] => [
            label,
            returnsWhere((state) => state.firstAction === action),
          ]
        ),
        allReturns
      ),
      dormantFor: distribution(
        Array.map(DORMANT_FOR, ([label, bucket]): readonly [string, number] => [
          label,
          returnsWhere((state) => state.dormantFor === bucket),
        ]),
        allReturns
      ),
      reactivationByClub: {
        headers: ['Group', 'Returns', 'Core action within 7 days'],
        rows: [
          returnsRow('Club member', (state) => state.clubMember === true),
          returnsRow('Not a Club member', (state) => state.clubMember !== true),
        ],
      },
      returnsByEntry: {
        headers: [
          'How they came back',
          'Returns',
          '% of returns',
          'Core action within 7 days',
        ],
        rows: Array.map(RETURN_ENTRIES, ([label, source]) => {
          const entryReturns = returnsWhere(
            (state) => state.openedFrom === source
          )
          return [
            label,
            formatValue.count(countOrNull(entryReturns)),
            formatValue.pct(percentOrNull(entryReturns, allReturns)),
            formatValue.pct(
              percentOrNull(
                returnsWhere(
                  (state) =>
                    state.openedFrom === source && state.coreAction === true
                ),
                entryReturns
              )
            ),
          ]
        }),
      },
    }
  })
