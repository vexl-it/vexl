import {type RegistrationWeek} from '@/src/services/analytics/domain'
import {DaysBucket} from '@vexl-next/analytics-definitions/src/buckets'
import {type DayString} from '@vexl-next/analytics-definitions/src/core'
import {
  ActivatedBy,
  ActivationClass,
  registrationCohortJourney,
  type RegistrationCohortState,
} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'
import {Effect} from 'effect'
import {
  buildWeeklyReport,
  isWeekProvisional,
  journeyOutcome,
  suppressCounts,
} from './rules'
import {
  payloadValueCounts,
  selectWeeklyValueCounts,
  sumCounts,
} from './weeklyValueCounts'

export const registrationActivation = (
  minGroupSize: number,
  today: DayString
) =>
  Effect.gen(function* (_) {
    const rows = yield* _(
      selectWeeklyValueCounts(registrationCohortJourney.name)
    )
    return yield* _(
      buildWeeklyReport(rows, minGroupSize, (week) => {
        const provisional = isWeekProvisional(
          registrationCohortJourney,
          week.weekStart,
          today
        )
        const activatedBy = payloadValueCounts<RegistrationCohortState>(
          week.values,
          'activatedBy'
        )
        return Effect.all({
          weekStart: Effect.succeed(week.weekStart),
          provisional: Effect.succeed(provisional),
          instances: Effect.succeed(week.instances),
          outcome: journeyOutcome({
            instances: week.instances,
            completed: sumCounts(activatedBy),
            provisional,
            minGroupSize,
          }),
          activatedBy: suppressCounts(ActivatedBy, activatedBy, minGroupSize),
          activationClass: suppressCounts(
            ActivationClass,
            payloadValueCounts<RegistrationCohortState>(
              week.values,
              'activationClass'
            ),
            minGroupSize
          ),
          registrationToActivation: suppressCounts(
            DaysBucket,
            payloadValueCounts<RegistrationCohortState>(
              week.values,
              'registrationToActivation'
            ),
            minGroupSize
          ),
        }) satisfies Effect.Effect<RegistrationWeek, unknown>
      })
    )
  })
