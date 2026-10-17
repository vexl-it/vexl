import {type ClubsData} from '@/src/services/analytics/domain'
import {type ClubCountBucket} from '@vexl-next/analytics-definitions/src/buckets'
import {activityWeeklyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {
  onboardingJourney,
  type OnboardingState,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {Array, Effect, Option} from 'effect'
import {bucketsOf, daysOf, lastFinalWeek} from './buckets'
import {isNewRegistration, onboardingSnapshot, sawMainOffer} from './funnel'
import {
  countStates,
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

const CLUB_COUNTS: ReadonlyArray<readonly [string, ClubCountBucket]> = [
  ['0', '0'],
  ['1', '1'],
  ['2', '2'],
  ['3+', '3plus'],
]

type Onboarding = Partial<OnboardingState>

export const loadClubs = (scope: QueryScope): QueryResult<ClubsData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    const backendBuckets = bucketsOf(filters, 'backend')
    const weekBuckets = bucketsOf(
      {period: 'week', range: filters.range},
      activityWeeklyAggregation
    )
    const lastWeek = lastFinalWeek(activityWeeklyAggregation)
    const snapshot = onboardingSnapshot(scope)

    const data = yield* _(
      Effect.all(
        {
          joins: sumMetric({
            name: 'USER_JOINED_CLUB_AND_IMPORTED_CONTACTS',
            days: daysOf(backendBuckets),
            period: filters.period,
            dimensions: {
              country: 'clientCountryPrefix',
              platform: 'appPlatform',
            },
            scope,
          }),
          weekly: countStates(activityWeeklyAggregation.name, {
            state: activityWeeklyAggregation.payloadSchema.pick(
              'clubs',
              'coreActionMain',
              'coreActionClub'
            ),
            days: daysOf(weekBuckets),
            period: 'week',
            scope,
          }),
          onboarding: countStates(onboardingJourney.name, {
            state: onboardingJourney.payloadSchema.pick(
              'step',
              'existingAccount',
              'clubJoin',
              'contactsImport',
              'firstMarketplaceLoad',
              'offerOpened',
              'activation',
              'clubActivation'
            ),
            days: snapshot.days,
            scope,
          }),
        },
        {concurrency: 'unbounded'}
      )
    )

    const marketplaceUse = seriesOf(weekBuckets, (bucket) => {
      const rows = Array.filter(data.weekly, inBucket(bucket))
      const members = Array.filter(
        rows,
        (row) => row.state.clubs !== undefined && row.state.clubs !== '0'
      )
      const others = Array.filter(rows, (row) => row.state.clubs === '0')
      const share = (
        group: typeof rows,
        kind: 'coreActionMain' | 'coreActionClub'
      ): number | null =>
        percentOrNull(
          sumWhere(group, (row) => row.state[kind] === true),
          sumWhere(group, () => true)
        )
      return {
        membersMain: share(members, 'coreActionMain'),
        membersClub: share(members, 'coreActionClub'),
        othersMain: share(others, 'coreActionMain'),
      }
    })

    const registrations = Array.filter(data.onboarding, (row) =>
      isNewRegistration(row.state)
    )
    // A null column cannot happen for the group: joining after the import
    // means the import happened, and without a Club there is no Club activation
    const conversionRow = (
      label: string,
      joined: (state: Onboarding) => boolean,
      applies: {imported: boolean; clubsOnly: boolean}
    ): string[] => {
      const rows = Array.filter(registrations, (row) => joined(row.state))
      const count = (predicate: (state: Onboarding) => boolean): number =>
        sumWhere(rows, (row) => predicate(row.state))
      return shareRow(
        label,
        count(() => true),
        [
          applies.imported
            ? count((state) => state.contactsImport === 'completed')
            : null,
          count(sawMainOffer),
          count((state) => state.offerOpened === true),
          count((state) => state.activation !== undefined),
          applies.clubsOnly
            ? count(
                (state) =>
                  state.clubActivation !== undefined &&
                  state.activation === undefined
              )
            : null,
        ]
      )
    }
    const lastWeekRows = Option.match(lastWeek, {
      onNone: () => [],
      onSome: (week) => Array.filter(data.weekly, inBucket(week)),
    })
    const clubInstalls = sumWhere(
      lastWeekRows,
      (row) => row.state.clubs !== undefined
    )

    return {
      joins: seriesOf(backendBuckets, (bucket) => ({
        joins: countOrNull(sumValues(data.joins, inBucket(bucket))),
      })),
      marketplaceUse,
      lastSettledWeek: Option.match(lastWeek, {
        onNone: () => '',
        onSome: (week) => week.label,
      }),
      cohorts: snapshot.cohorts,
      conversion: {
        headers: [
          'Group',
          'New registrations',
          'Imported contacts',
          'Saw at least 1 main offer',
          'Opened a main offer',
          'Activated in main within 30 days',
          'Activated in Clubs only',
        ],
        rows: [
          conversionRow(
            'Joined a Club before importing contacts',
            (state) => state.clubJoin === 'beforeContactsImport',
            {imported: true, clubsOnly: true}
          ),
          conversionRow(
            'Joined a Club after importing contacts',
            (state) => state.clubJoin === 'afterContactsImport',
            {imported: false, clubsOnly: true}
          ),
          conversionRow(
            "Didn't join a Club in their first 37 days",
            (state) => state.clubJoin === undefined,
            {imported: true, clubsOnly: false}
          ),
        ],
      },
      clubsPerInstall: distribution(
        Array.map(CLUB_COUNTS, ([label, clubs]): readonly [string, number] => [
          label,
          sumWhere(lastWeekRows, (row) => row.state.clubs === clubs),
        ]),
        clubInstalls
      ),
    }
  })
