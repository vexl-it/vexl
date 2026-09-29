import {type AnalyticsDashboard} from '@/src/services/analytics/domain'
import {dayOf} from '@vexl-next/analytics-definitions/src/buckets'
import {Effect} from 'effect'
import {analyticsMinGroupSizeConfig} from '../config'
import {marketplaceWeekly} from './marketplace'
import {onboardingFunnel} from './onboarding'
import {registrationActivation} from './registration'

export const loadAnalyticsDashboard = Effect.gen(function* (_) {
  const minGroupSize = yield* _(analyticsMinGroupSizeConfig)
  const today = dayOf(new Date())

  return yield* _(
    Effect.all(
      {
        minGroupSize: Effect.succeed(minGroupSize),
        onboarding: onboardingFunnel(minGroupSize, today),
        registration: registrationActivation(minGroupSize, today),
        marketplace: marketplaceWeekly(minGroupSize, today),
      },
      {concurrency: 'unbounded'}
    ) satisfies Effect.Effect<AnalyticsDashboard, unknown, unknown>
  )
})
