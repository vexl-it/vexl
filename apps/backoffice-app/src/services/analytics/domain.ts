import {Schema} from 'effect'

export const AnalyticsView = Schema.Literal(
  'funnel',
  'liquidity',
  'activity',
  'retention',
  'clubs',
  'nudges',
  'chats'
)
export type AnalyticsView = typeof AnalyticsView.Type

export const Period = Schema.Literal('day', 'week', 'month', 'quarter')
export type Period = typeof Period.Type
// Unique counts (active installs) cannot be summed across buckets, so they
// have no quarter
export type UniquePeriod = Exclude<Period, 'quarter'>

export const Range = Schema.Literal('3m', '6m', '12m', 'all')
export type Range = typeof Range.Type

export const PlatformFilter = Schema.Literal('all', 'ios', 'android')
export type PlatformFilter = typeof PlatformFilter.Type

// A phone country prefix, or the small countries together
export const CountryFilter = Schema.Union(
  Schema.Literal('all', 'other'),
  Schema.String.pipe(Schema.pattern(/^\d{1,4}$/))
)
export type CountryFilter = typeof CountryFilter.Type

export const AnalyticsFilters = Schema.Struct({
  period: Period,
  range: Range,
  country: CountryFilter,
  platform: PlatformFilter,
})
export type AnalyticsFilters = typeof AnalyticsFilters.Type

export const MIN_GROUP_SIZE = 20

export const PERIOD_OPTIONS: ReadonlyArray<{value: Period; label: string}> = [
  {value: 'day', label: 'Day'},
  {value: 'week', label: 'Week'},
  {value: 'month', label: 'Month'},
  {value: 'quarter', label: 'Quarter'},
]

export const PERIOD_ADJECTIVE: Record<Period, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
}

export const RANGE_OPTIONS: ReadonlyArray<{value: Range; label: string}> = [
  {value: '3m', label: 'Last 3 months'},
  {value: '6m', label: 'Last 6 months'},
  {value: '12m', label: 'Last 12 months'},
  {value: 'all', label: 'All (18 months)'},
]

export const PLATFORM_OPTIONS: ReadonlyArray<{
  value: PlatformFilter
  label: string
}> = [
  {value: 'all', label: 'All platforms'},
  {value: 'ios', label: 'iOS'},
  {value: 'android', label: 'Android'},
]

export interface CountryOption {
  readonly value: CountryFilter
  readonly label: string
}

export interface CountryOptionsResponse {
  readonly countries: readonly CountryOption[]
}

export const uniquePeriodOf = (period: Period): UniquePeriod =>
  period === 'quarter' ? 'month' : period

// Days are capped at the shortest range so a chart stays readable
export const rangeShown = ({
  period,
  range,
}: Pick<AnalyticsFilters, 'period' | 'range'>): Range =>
  period === 'day' ? '3m' : range

export type Population = 'client' | 'backend'

export interface SeriesPoint {
  readonly label: string
  readonly provisional: boolean
  readonly values: Readonly<Record<string, number | null>>
}

export interface FunnelStep {
  readonly label: string
  readonly count: number | null
}

export interface TableData {
  readonly headers: readonly string[]
  readonly rows: ReadonlyArray<readonly string[]>
}

// 'pending': the target week has not settled yet
export type CohortCell = number | null | 'pending'

export interface CohortData {
  readonly rowHeader: string
  readonly columns: readonly string[]
  readonly rows: ReadonlyArray<{
    readonly label: string
    readonly values: readonly CohortCell[]
  }>
}

// The journeys a snapshot adds up: start weeks in the range whose lifetime plus
// grace has passed. `span` is null when no week in the range is final yet.
export interface JourneyCohorts {
  // What started the journey, e.g. "requests sent"
  readonly subject: string
  readonly waitDays: number
  readonly span: string | null
}

export const cohortsNote = ({
  subject,
  waitDays,
  span,
}: JourneyCohorts): string =>
  span === null
    ? `Nothing to show yet: a week is added ${waitDays} days after it ends, once its results are final. Pick a longer range.`
    : `Covers ${subject} in the weeks ${span}. Newer weeks are added ${waitDays} days after they end, once their results are final.`

const pct = (value: number | null): string =>
  value === null ? 'n/a' : `${value.toFixed(1)} %`

const count = (value: number | null): string =>
  value === null ? '<20' : value.toLocaleString('en')

export const formatValue = {pct, count}

export interface ColoredCountry {
  readonly key: string
  readonly label: string
}

export interface FunnelData {
  readonly anyAccountSteps: readonly FunnelStep[]
  readonly newAccountSteps: readonly FunnelStep[]
  readonly startsAtRegistered: boolean
  readonly activationRate: number | null
  readonly clubOnlyActivationRate: number | null
  readonly activationTrend: readonly SeriesPoint[]
  readonly cohortWaitDays: number
  readonly contactsImport: readonly SeriesPoint[]
  readonly timeToActivation: readonly SeriesPoint[]
  readonly activationByOffersSeen: readonly SeriesPoint[]
  readonly offersSeenTable: TableData
  readonly registrations: readonly SeriesPoint[]
  readonly cohorts: JourneyCohorts
  readonly timeToRegistration: readonly SeriesPoint[]
}

export interface CountrySeries {
  readonly countries: readonly ColoredCountry[]
  readonly points: readonly SeriesPoint[]
}

export interface RequestOutcomes {
  readonly label: string
  readonly points: readonly SeriesPoint[]
}

export interface LiquidityData {
  readonly activeOffersNow: number | null
  readonly lastSettledWeek: string
  readonly offersCreated: readonly SeriesPoint[]
  readonly emptyMarketplace: CountrySeries
  readonly offerCohorts: JourneyCohorts
  readonly requestCohorts: JourneyCohorts
  readonly activeOffers: readonly SeriesPoint[]
  readonly visibleByCountry: TableData
  readonly requestOutcomes: readonly RequestOutcomes[]
  readonly requestsSent: readonly SeriesPoint[]
  readonly timeToFirstRequest: TableData
  readonly timeToResponse: readonly SeriesPoint[]
  readonly medianVisibility: CountrySeries
}

export interface LastSettled {
  readonly label: string
  readonly value: number | null
}

export interface ActivityData {
  readonly tiles: {
    readonly day: LastSettled
    readonly week: LastSettled
    readonly month: LastSettled
    readonly dayCore: LastSettled
    readonly weekCore: LastSettled
    readonly monthCore: LastSettled
  }
  readonly actives: readonly SeriesPoint[]
  readonly offersOpened: readonly SeriesPoint[]
  readonly stickiness: readonly SeriesPoint[]
  readonly lastSettledWeek: string
  readonly activeDays: readonly SeriesPoint[]
  readonly actionsPerInstall: TableData
  readonly backendActive30d: readonly SeriesPoint[]
}

export interface RetentionData {
  readonly cohort: CohortData
  readonly cohortPeriod: Exclude<Period, 'day'>
  readonly registrationCohorts: JourneyCohorts
  readonly reactivationCohorts: JourneyCohorts
  readonly dayRetention: TableData
  readonly reactivations: readonly SeriesPoint[]
  readonly dormantPool: readonly SeriesPoint[]
  readonly backendReturns: readonly SeriesPoint[]
  readonly reactivationRate: readonly SeriesPoint[]
  readonly firstActionAfterReturn: readonly SeriesPoint[]
  readonly dormantFor: readonly SeriesPoint[]
  readonly reactivationByClub: TableData
  readonly returnsByEntry: TableData
}

export interface ClubsData {
  readonly joins: readonly SeriesPoint[]
  readonly marketplaceUse: readonly SeriesPoint[]
  readonly lastSettledWeek: string
  readonly cohorts: JourneyCohorts
  readonly conversion: TableData
  readonly clubsPerInstall: readonly SeriesPoint[]
}

export interface NudgesData {
  readonly sentSpan: string
  readonly openCohorts: JourneyCohorts
  readonly promptCohorts: JourneyCohorts
  readonly pushSent: TableData
  readonly opens: TableData
  readonly prompts: TableData
  readonly notificationsAllowed: readonly SeriesPoint[]
}

export interface Conversation {
  readonly label: string
  readonly steps: readonly FunnelStep[]
}

export interface ChatsData {
  readonly conversations: readonly Conversation[]
  readonly cohorts: JourneyCohorts
  readonly ratings: readonly SeriesPoint[]
  readonly positiveRate: number | null
}

export interface AnalyticsViewData {
  readonly funnel: FunnelData
  readonly liquidity: LiquidityData
  readonly activity: ActivityData
  readonly retention: RetentionData
  readonly clubs: ClubsData
  readonly nudges: NudgesData
  readonly chats: ChatsData
}
