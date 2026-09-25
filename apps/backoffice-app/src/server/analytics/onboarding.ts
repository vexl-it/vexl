import {type OnboardingWeek} from '@/src/services/analytics/domain'
import {DurationBucket} from '@vexl-next/analytics-definitions/src/buckets'
import {type DayString} from '@vexl-next/analytics-definitions/src/core'
import {
  ContactsImportOutcome,
  onboardingJourney,
  OnboardingStep,
  type OnboardingState,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {Array, Effect, Number} from 'effect'
import {
  buildWeeklyReport,
  isWeekProvisional,
  journeyOutcome,
  suppressCounts,
} from './rules'
import {payloadValueCounts, selectWeeklyValueCounts} from './weeklyValueCounts'

export const onboardingFunnel = (minGroupSize: number, today: DayString) =>
  Effect.gen(function* (_) {
    const rows = yield* _(selectWeeklyValueCounts(onboardingJourney.name))
    return yield* _(
      buildWeeklyReport(rows, minGroupSize, (week) => {
        const provisional = isWeekProvisional(
          onboardingJourney,
          week.weekStart,
          today
        )
        const steps = payloadValueCounts<OnboardingState>(week.values, 'step')
        return Effect.all({
          weekStart: Effect.succeed(week.weekStart),
          provisional: Effect.succeed(provisional),
          instances: Effect.succeed(week.instances),
          outcome: journeyOutcome({
            instances: week.instances,
            completed: Number.sumAll(
              Array.map(
                onboardingJourney.terminalStates,
                (step) => steps[step] ?? 0
              )
            ),
            provisional,
            minGroupSize,
          }),
          step: suppressCounts(OnboardingStep, steps, minGroupSize),
          contactsImport: suppressCounts(
            ContactsImportOutcome,
            payloadValueCounts<OnboardingState>(week.values, 'contactsImport'),
            minGroupSize
          ),
          openToRegistration: suppressCounts(
            DurationBucket,
            payloadValueCounts<OnboardingState>(
              week.values,
              'openToRegistration'
            ),
            minGroupSize
          ),
        }) satisfies Effect.Effect<OnboardingWeek, unknown>
      })
    )
  })
