import {
  bucketDays,
  bucketDuration,
} from '@vexl-next/analytics-definitions/src/buckets'
import {marketplaceWeeklyAggregation} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {
  onboardingJourney,
  OnboardingStep,
  type OnboardingState,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {
  registrationCohortJourney,
  type ActivatedBy,
  type ActivationClass,
} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Option, pipe, Schema, Struct} from 'effect'
import {atom} from 'jotai'
import {
  analyticsEnabledAtom,
  analyticsInstancesAtom,
  analyticsMarkersAtom,
  setAnalyticsMarkersAtom,
} from './atoms'
import {findOpenJourney} from './instances'
import {aggregationReportActionAtom, journeyReportActionAtom} from './report'

export {analyticsEnabledAtom} from './atoms'

const onboardingJourneyActionAtom = journeyReportActionAtom(onboardingJourney)
const registrationCohortActionAtom = journeyReportActionAtom(
  registrationCohortJourney
)

export const reportMarketplaceWeeklyActionAtom = aggregationReportActionAtom(
  marketplaceWeeklyAggregation,
  {marketplaceOpened: 0, firstLoadResult: 'notLoaded'}
)

const onboardingStepRank = (step: OnboardingStep): number =>
  OnboardingStep.literals.indexOf(step)

/**
 * Onboarding steps never start a journey (only the first app open does) and
 * never move the funnel backwards, so a screen shown again is not a drop-off.
 */
export const reportOnboardingStepActionAtom = atom(
  null,
  (get, set, {step, ...rest}: Partial<OnboardingState>) => {
    const currentStep = pipe(
      findOpenJourney(get(analyticsInstancesAtom), onboardingJourney.name),
      Option.map((one) => one.payload),
      Option.filter(Schema.is(onboardingJourney.payloadSchema)),
      Option.map((state) => state.step)
    )
    const advances =
      step !== undefined &&
      Option.exists(
        currentStep,
        (current) => onboardingStepRank(current) < onboardingStepRank(step)
      )
    const partial = advances ? {step, ...rest} : rest
    if (!Array.isNonEmptyArray(Struct.keys(partial))) return
    set(onboardingJourneyActionAtom, partial, {onlyIfOpen: true})
  }
)

export const reportAppOpenedWhileLoggedOutActionAtom = atom(
  null,
  (get, set) => {
    if (!get(analyticsEnabledAtom)) return
    if (get(analyticsMarkersAtom).firstOpenAt !== undefined) return

    set(setAnalyticsMarkersAtom, (markers) => ({
      ...markers,
      firstOpenAt: unixMillisecondsNow(),
    }))
    set(onboardingJourneyActionAtom, {step: 'opened'})
  }
)

export const reportRegisteredActionAtom = atom(null, (get, set) => {
  if (!get(analyticsEnabledAtom)) return

  const registeredAt = unixMillisecondsNow()
  const {firstOpenAt} = get(analyticsMarkersAtom)
  set(setAnalyticsMarkersAtom, (markers) => ({...markers, registeredAt}))
  set(reportOnboardingStepActionAtom, {
    step: 'registered',
    ...(firstOpenAt !== undefined
      ? {openToRegistration: bucketDuration(registeredAt - firstOpenAt)}
      : {}),
  })
  set(registrationCohortActionAtom, {})
})

export const activationClassForCreatedOffer = (
  intendedClubs: readonly ClubUuid[]
): ActivationClass =>
  Array.isEmptyReadonlyArray(intendedClubs) ? 'main' : 'both'

/** `club` when the offer reached this device only through a club. */
export const activationClassForRequest = (
  offer: OneOfferInState
): ActivationClass => {
  const {friendLevel} = offer.offerInfo.privatePart
  const throughContacts = Array.some(
    friendLevel,
    (level) => level === 'FIRST_DEGREE' || level === 'SECOND_DEGREE'
  )
  return !throughContacts && Array.contains(friendLevel, 'CLUB')
    ? 'club'
    : 'main'
}

/** First core action after registration. Written once per install. */
export const reportActivationActionAtom = atom(
  null,
  (
    get,
    set,
    {
      activatedBy,
      activationClass,
    }: {activatedBy: ActivatedBy; activationClass: ActivationClass}
  ) => {
    if (!get(analyticsEnabledAtom)) return

    const markers = get(analyticsMarkersAtom)
    if (markers.activatedAt !== undefined) return

    const activatedAt = unixMillisecondsNow()
    set(setAnalyticsMarkersAtom, (old) => ({...old, activatedAt}))
    if (markers.registeredAt === undefined) return

    set(
      registrationCohortActionAtom,
      {
        activatedBy,
        activationClass,
        registrationToActivation: bucketDays(
          activatedAt - markers.registeredAt
        ),
      },
      {onlyIfOpen: true}
    )
  }
)
