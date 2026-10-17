import {
  bucketDays,
  bucketOffersVisible,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  isClubCoreAction,
  isMainCoreAction,
  type CoreActionClass,
} from '@vexl-next/analytics-definitions/src/coreAction'
import {
  onboardingJourney,
  OnboardingStep,
  type ActivationKind,
  type ContactsImportOutcome,
  type OnboardingState,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Option, pipe} from 'effect'
import {type SubmitContactsResult} from '../../state/contacts/atom/submitContactsActionAtom'
import {analyticsActionAtom} from './analyticsActionAtom'
import {analyticsMarkersAtom, setAnalyticsMarkersAtom} from './atoms'
import {journeyReportActionAtom, type JourneyUpdate} from './report'
import {
  coreActionWindow,
  isWithinActivationWindow,
  type CoreActionWindow,
} from './windows'

export type CoreActionKind = ActivationKind | 'approval'

const onboardingJourneyAtom = journeyReportActionAtom(onboardingJourney)

/** Only the first open starts the journey, every later signal updates it. */
export const updateOnboardingActionAtom = analyticsActionAtom(
  (get, set, update: JourneyUpdate<OnboardingState>) => {
    set(onboardingJourneyAtom, update, {onlyIfOpen: true})
  }
)

const stepRank = (step: OnboardingStep): number =>
  OnboardingStep.literals.indexOf(step)

/** The step never moves back, so a screen shown again is not a drop-off. */
const advanceTo =
  (step: OnboardingStep) =>
  (current: Option.Option<OnboardingState>): Partial<OnboardingState> =>
    Option.exists(current, (state) => stepRank(state.step) >= stepRank(step))
      ? {}
      : {step}

export const reportFirstOpenActionAtom = analyticsActionAtom((get, set) => {
  if (get(analyticsMarkersAtom).firstOpenAt !== undefined) return

  set(setAnalyticsMarkersAtom, (markers) => ({
    ...markers,
    firstOpenAt: unixMillisecondsNow(),
  }))
  set(onboardingJourneyAtom, {step: 'opened'})
})

export const reportOnboardingStepActionAtom = analyticsActionAtom(
  (get, set, step: OnboardingStep) => {
    set(updateOnboardingActionAtom, advanceTo(step))
  }
)

export const reportExistingAccountActionAtom = analyticsActionAtom(
  (get, set, exists: boolean) => {
    if (exists) set(updateOnboardingActionAtom, {existingAccount: true})
  }
)

/** `registeredAt` is set only for a new account, so tenure ignores re-logins. */
export const reportRegisteredActionAtom = analyticsActionAtom(
  (get, set, {existingAccount}: {existingAccount: boolean}) => {
    const registeredAt = unixMillisecondsNow()
    const {firstOpenAt} = get(analyticsMarkersAtom)
    if (!existingAccount)
      set(setAnalyticsMarkersAtom, (markers) => ({...markers, registeredAt}))

    set(updateOnboardingActionAtom, (current) => ({
      ...advanceTo('registered')(current),
      ...(firstOpenAt !== undefined
        ? {registeredAfter: bucketDays(registeredAt - firstOpenAt)}
        : {}),
    }))
  }
)

/** `completed` only when at least one contact was imported. */
export const contactsImportOutcome: Record<
  SubmitContactsResult,
  ContactsImportOutcome
> = {
  success: 'completed',
  noContactsSelected: 'failed',
  permissionsNotGranted: 'denied',
  otherError: 'failed',
}

export const reportContactsImportActionAtom = analyticsActionAtom(
  (get, set, contactsImport: ContactsImportOutcome) => {
    set(updateOnboardingActionAtom, {contactsImport})
  }
)

export const reportClubJoinedActionAtom = analyticsActionAtom((get, set) => {
  if (get(analyticsMarkersAtom).firstClubJoinedAt !== undefined) return

  set(setAnalyticsMarkersAtom, (markers) => ({
    ...markers,
    firstClubJoinedAt: unixMillisecondsNow(),
  }))
  set(updateOnboardingActionAtom, (current) => ({
    clubJoin: Option.exists(
      current,
      (state) => state.contactsImport === 'completed'
    )
      ? 'afterContactsImport'
      : 'beforeContactsImport',
  }))
})

export const reportFirstMarketplaceLoadActionAtom = analyticsActionAtom(
  (get, set, mainOffersCount: number) => {
    set(updateOnboardingActionAtom, (current) =>
      Option.exists(
        current,
        (state) => state.firstMarketplaceLoad !== undefined
      )
        ? {}
        : {firstMarketplaceLoad: bucketOffersVisible(mainOffersCount)}
    )
  }
)

const windowField: Record<CoreActionWindow, Partial<OnboardingState>> = {
  coreActionD1: {coreActionD1: true},
  coreActionD7: {coreActionD7: true},
  coreActionD30: {coreActionD30: true},
}

export const reportOnboardingCoreActionActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {kind, actionClass}: {kind: CoreActionKind; actionClass: CoreActionClass}
  ) => {
    const now = new Date()
    const {registeredAt, activatedAt, clubActivatedAt} =
      get(analyticsMarkersAtom)
    const registered = Option.fromNullable(registeredAt)
    // Approving a request is a core action, but it does not activate.
    const activationKind = Option.liftPredicate(
      kind,
      (one): one is ActivationKind => one !== 'approval'
    )

    const activation = pipe(
      Option.all([activationKind, registered]),
      Option.filter(
        ([, at]) =>
          isMainCoreAction(actionClass) &&
          activatedAt === undefined &&
          isWithinActivationWindow(at, now)
      ),
      Option.map(
        ([one, at]): Partial<OnboardingState> => ({
          activation: one,
          activatedAfter: bucketDays(now.getTime() - at),
        })
      )
    )
    const clubActivation = pipe(
      activationKind,
      Option.filter(
        () => isClubCoreAction(actionClass) && clubActivatedAt === undefined
      ),
      Option.map((one): Partial<OnboardingState> => ({clubActivation: one}))
    )
    const window = pipe(
      registered,
      Option.flatMap((at) => coreActionWindow(at, now)),
      Option.map((one) => windowField[one])
    )

    set(setAnalyticsMarkersAtom, (markers) => ({
      ...markers,
      ...(Option.isSome(activation)
        ? {activatedAt: unixMillisecondsNow()}
        : {}),
      ...(Option.isSome(clubActivation)
        ? {clubActivatedAt: unixMillisecondsNow()}
        : {}),
    }))
    set(updateOnboardingActionAtom, {
      ...Option.getOrElse(activation, () => ({})),
      ...Option.getOrElse(clubActivation, () => ({})),
      ...Option.getOrElse(window, () => ({})),
    })
  }
)
