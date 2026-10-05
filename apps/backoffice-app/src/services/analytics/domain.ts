import {
  DaysBucket,
  DurationBucket,
  OffersVisibleBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {DayString} from '@vexl-next/analytics-definitions/src/core'
import {FirstLoadResult} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {
  ContactsImportOutcome,
  OnboardingStep,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {
  ActivatedBy,
  ActivationClass,
} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'
import {Schema} from 'effect'

// `completed` is the journey's goal (onboarding finished, activation),
// `open` is a cohort still within lifetime and grace, `unknown` is a matured
// cohort without the goal. Never churn.
export const JourneyOutcome = Schema.Literal('completed', 'open', 'unknown')
export type JourneyOutcome = typeof JourneyOutcome.Type

export const MarketplaceOpenedBucket = Schema.Literal(
  '0',
  '1',
  '2to5',
  '6to20',
  '21plus'
)
export type MarketplaceOpenedBucket = typeof MarketplaceOpenedBucket.Type

// Categories under the minimum group size are zeroed and summed into `other`.
export const CategoryCounts = <V extends string>(values: Schema.Schema<V>) =>
  Schema.Struct({
    counts: Schema.Record({key: values, value: Schema.Int}),
    other: Schema.Int,
  })
export interface CategoryCounts<V extends string> {
  readonly counts: Readonly<Record<V, number>>
  readonly other: number
}

const WeekFields = {
  weekStart: DayString,
  provisional: Schema.Boolean,
  instances: Schema.Int,
}

export const OnboardingWeek = Schema.Struct({
  ...WeekFields,
  outcome: CategoryCounts(JourneyOutcome),
  step: CategoryCounts(OnboardingStep),
  contactsImport: CategoryCounts(ContactsImportOutcome),
  openToRegistration: CategoryCounts(DurationBucket),
})
export type OnboardingWeek = typeof OnboardingWeek.Type

export const RegistrationWeek = Schema.Struct({
  ...WeekFields,
  outcome: CategoryCounts(JourneyOutcome),
  activatedBy: CategoryCounts(ActivatedBy),
  activationClass: CategoryCounts(ActivationClass),
  registrationToActivation: CategoryCounts(DaysBucket),
})
export type RegistrationWeek = typeof RegistrationWeek.Type

export const MarketplaceWeek = Schema.Struct({
  ...WeekFields,
  firstLoadResult: CategoryCounts(FirstLoadResult),
  offersVisibleBucket: CategoryCounts(OffersVisibleBucket),
  marketplaceOpened: CategoryCounts(MarketplaceOpenedBucket),
})
export type MarketplaceWeek = typeof MarketplaceWeek.Type

const WeeklyReport = <W extends Schema.Schema.AnyNoContext>(week: W) =>
  Schema.Struct({weeks: Schema.Array(week), hiddenWeeks: Schema.Int})

export const MarketplaceCountry = Schema.Struct({
  countryPrefix: Schema.String,
  weeks: Schema.Array(MarketplaceWeek),
})
export type MarketplaceCountry = typeof MarketplaceCountry.Type

export const AnalyticsDashboard = Schema.Struct({
  minGroupSize: Schema.Int,
  onboarding: WeeklyReport(OnboardingWeek),
  registration: WeeklyReport(RegistrationWeek),
  marketplace: Schema.Struct({
    ...WeeklyReport(MarketplaceWeek).fields,
    countries: Schema.Array(MarketplaceCountry),
  }),
})
export type AnalyticsDashboard = typeof AnalyticsDashboard.Type
