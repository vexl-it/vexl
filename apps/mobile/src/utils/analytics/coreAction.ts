import {type CoreActionClass} from '@vexl-next/analytics-definitions/src/coreAction'
import {reportActivityCoreActionActionAtom} from './activity'
import {analyticsActionAtom} from './analyticsActionAtom'
import {
  reportOnboardingCoreActionActionAtom,
  type CoreActionKind,
} from './onboarding'
import {reactivationJourneyAtom} from './reactivation'

/**
 * One core action, classified with the rules in `coreAction.ts` of the
 * definitions package, fanned out to every definition that counts it.
 */
export const reportCoreActionActionAtom = analyticsActionAtom(
  (
    get,
    set,
    coreAction: {kind: CoreActionKind; actionClass: CoreActionClass}
  ) => {
    set(reportActivityCoreActionActionAtom, coreAction)
    set(reportOnboardingCoreActionActionAtom, coreAction)
    set(reactivationJourneyAtom, {coreAction: true}, {onlyIfOpen: true})
  }
)
