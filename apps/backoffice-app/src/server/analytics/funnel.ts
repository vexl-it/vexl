import {
  formatValue,
  type FunnelData,
  type FunnelStep,
} from '@/src/services/analytics/domain'
import {
  type DaysBucket,
  type OffersVisibleBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  onboardingJourney,
  type OnboardingState,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {Array, Effect, pipe} from 'effect'
import {
  bucketsOf,
  daysOf,
  finalBuckets,
  journeyWaitDays,
  snapshotOf,
} from './buckets'
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
} from './stats'

type Onboarding = Partial<OnboardingState>

// From phone verification on, re-logins are known and left out
const isNewAccount = (state: Onboarding): boolean =>
  state.existingAccount !== true

export const isNewRegistration = (state: Onboarding): boolean =>
  state.step === 'registered' && isNewAccount(state)

const activatedInClubsOnly = (state: Onboarding): boolean =>
  state.clubActivation !== undefined && state.activation === undefined

export const onboardingSnapshot = (scope: QueryScope) =>
  snapshotOf(
    scope.filters.range,
    'new installs that first opened the app',
    onboardingJourney.lifetimeDays
  )

export const loadFunnel = (scope: QueryScope): QueryResult<FunnelData> =>
  Effect.gen(function* (_) {
    const {filters} = scope
    const snapshot = onboardingSnapshot(scope)
    const trendBuckets = finalBuckets(bucketsOf(filters, onboardingJourney))
    const registrationBuckets = bucketsOf(filters, 'backend')

    const {rows, trendRows, registrations} = yield* _(
      Effect.all(
        {
          rows: countStates(onboardingJourney.name, {
            state: onboardingJourney.payloadSchema.pick(
              'step',
              'existingAccount',
              'contactsImport',
              'firstMarketplaceLoad',
              'offerOpened',
              'activation',
              'clubActivation',
              'registeredAfter',
              'activatedAfter'
            ),
            days: snapshot.days,
            scope,
          }),
          trendRows: countStates(onboardingJourney.name, {
            state: onboardingJourney.payloadSchema.pick(
              'step',
              'existingAccount',
              'activation',
              'clubActivation'
            ),
            days: daysOf(trendBuckets),
            period: filters.period,
            scope,
          }),
          registrations: sumMetric({
            name: 'USER_LOGGED_IN',
            where: {numberExists: 'false'},
            days: daysOf(registrationBuckets),
            period: filters.period,
            dimensions: {country: 'countryPrefix', platform: 'appPlatform'},
            scope,
          }),
        },
        {concurrency: 'unbounded'}
      )
    )

    const total = (predicate: (state: Onboarding) => boolean): number =>
      sumWhere(rows, (row) => predicate(row.state))
    const registered = total(isNewRegistration)
    const registeredWith = (
      predicate: (state: Onboarding) => boolean
    ): number => total((state) => isNewRegistration(state) && predicate(state))

    const stepsOf = (
      items: ReadonlyArray<readonly [string, (state: Onboarding) => boolean]>
    ): readonly FunnelStep[] =>
      Array.map(items, ([label, predicate]) => ({
        label,
        count: countOrNull(total(predicate)),
      }))

    // Onboarding rows carry no country before `registered`
    const startsAtRegistered = filters.country !== 'all'
    const anyAccountSteps = startsAtRegistered
      ? []
      : stepsOf([
          ['First open', () => true],
          ['Phone number entered', (state) => state.step !== 'opened'],
        ])
    const newAccountSteps = stepsOf([
      ...(startsAtRegistered
        ? []
        : Array.of<readonly [string, (state: Onboarding) => boolean]>([
            'Phone number verified',
            (state) =>
              isNewAccount(state) &&
              (state.step === 'codeVerified' || state.step === 'registered'),
          ])),
      ['Registered', isNewRegistration],
      [
        'Reached contact import',
        (state) =>
          isNewRegistration(state) && state.contactsImport !== undefined,
      ],
      [
        'Contacts imported',
        (state) =>
          isNewRegistration(state) && state.contactsImport === 'completed',
      ],
      [
        'Marketplace loaded',
        (state) =>
          isNewRegistration(state) && state.firstMarketplaceLoad !== undefined,
      ],
      [
        'Saw at least 1 main offer',
        (state) => isNewRegistration(state) && sawMainOffer(state),
      ],
      [
        'Opened a main offer',
        (state) => isNewRegistration(state) && state.offerOpened === true,
      ],
      [
        'Activated within 30 days',
        (state) => isNewRegistration(state) && state.activation !== undefined,
      ],
    ])

    const activationTrend = seriesOf(trendBuckets, (bucket) => {
      const bucketRows = Array.filter(trendRows, inBucket(bucket))
      const count = (predicate: (state: Onboarding) => boolean): number =>
        sumWhere(
          bucketRows,
          (row) => isNewRegistration(row.state) && predicate(row.state)
        )
      const base = count(() => true)
      return {
        main: percentOrNull(
          count((state) => state.activation !== undefined),
          base
        ),
        club: percentOrNull(count(activatedInClubsOnly), base),
      }
    })

    const importedContacts = (state: Onboarding): boolean =>
      isNewRegistration(state) && state.contactsImport === 'completed'
    const offersSeenGroups = Array.map(
      OFFERS_SEEN_GROUPS,
      ([label, bucket]) => {
        const installs = total(
          (state) =>
            importedContacts(state) && state.firstMarketplaceLoad === bucket
        )
        const activated = total(
          (state) =>
            importedContacts(state) &&
            state.firstMarketplaceLoad === bucket &&
            state.activation !== undefined
        )
        return {label, installs, activated: percentOrNull(activated, installs)}
      }
    )
    const offersSeenTotal = pipe(
      offersSeenGroups,
      Array.reduce(0, (sum, group) => sum + group.installs)
    )
    const activated = registeredWith((state) => state.activation !== undefined)

    return {
      anyAccountSteps,
      newAccountSteps,
      startsAtRegistered,
      activationRate: percentOrNull(activated, registered),
      clubOnlyActivationRate: percentOrNull(
        registeredWith(activatedInClubsOnly),
        registered
      ),
      activationTrend,
      cohortWaitDays: journeyWaitDays(onboardingJourney.lifetimeDays),
      contactsImport: distribution(
        [
          [
            'Imported contacts',
            registeredWith((state) => state.contactsImport === 'completed'),
          ],
          [
            'Skipped',
            registeredWith((state) => state.contactsImport === 'skipped'),
          ],
          [
            'Did not allow access',
            registeredWith((state) => state.contactsImport === 'denied'),
          ],
          [
            'Import failed',
            registeredWith((state) => state.contactsImport === 'failed'),
          ],
          [
            'Left without finishing',
            registeredWith((state) => state.contactsImport === 'started'),
          ],
          [
            'Never got to this step',
            registeredWith((state) => state.contactsImport === undefined),
          ],
        ],
        registered
      ),
      timeToActivation: distribution(
        Array.map(
          DAYS_TO_ACTIVATION,
          ([label, bucket]): readonly [string, number] => [
            label,
            registeredWith(
              (state) =>
                state.activation !== undefined &&
                state.activatedAfter === bucket
            ),
          ]
        ),
        activated
      ),
      activationByOffersSeen: Array.map(offersSeenGroups, (group) => ({
        label: group.label,
        provisional: false,
        values: {activated: group.activated},
      })),
      offersSeenTable: {
        headers: [
          'Offers on first visit',
          'Installs',
          '% of these installs',
          'Activated',
        ],
        rows: Array.map(offersSeenGroups, (group) => [
          group.label,
          formatValue.count(countOrNull(group.installs)),
          formatValue.pct(percentOrNull(group.installs, offersSeenTotal)),
          formatValue.pct(group.activated),
        ]),
      },
      registrations: seriesOf(registrationBuckets, (bucket) => ({
        users: countOrNull(sumValues(registrations, inBucket(bucket))),
      })),
      cohorts: snapshot.cohorts,
      timeToRegistration: distribution(
        Array.map(
          DAYS_TO_REGISTRATION,
          ([label, bucket]): readonly [string, number] => [
            label,
            registeredWith((state) => state.registeredAfter === bucket),
          ]
        ),
        registered
      ),
    }
  })

export const sawMainOffer = (state: Onboarding): boolean =>
  state.firstMarketplaceLoad !== undefined && state.firstMarketplaceLoad !== '0'

const OFFERS_SEEN_GROUPS: ReadonlyArray<
  readonly [string, OffersVisibleBucket]
> = [
  ['0', '0'],
  ['1–5', '1to5'],
  ['6–20', '6to20'],
  ['21–50', '21to50'],
  ['51+', '51plus'],
]

const DAYS_TO_REGISTRATION: ReadonlyArray<readonly [string, DaysBucket]> = [
  ['Same day', 'd0'],
  ['Next day', 'd1'],
  ['2–7 days', 'd2To7'],
  ['8+ days', 'd8Plus'],
]

const DAYS_TO_ACTIVATION: ReadonlyArray<readonly [string, DaysBucket]> = [
  ['Same day', 'd0'],
  ['Next day', 'd1'],
  ['2–7 days', 'd2To7'],
  ['8–30 days', 'd8Plus'],
]
