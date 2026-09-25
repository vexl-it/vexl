import {
  type JourneyOutcome,
  type MarketplaceOpenedBucket,
} from '@/src/services/analytics/domain'
import {
  type DaysBucket,
  type DurationBucket,
  type OffersVisibleBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {type FirstLoadResult} from '@vexl-next/analytics-definitions/src/definitions/marketplaceWeekly'
import {
  type ContactsImportOutcome,
  type OnboardingStep,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {
  type ActivatedBy,
  type ActivationClass,
} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  opened: 'Opened',
  intro: 'Intro',
  phoneSubmitted: 'Phone submitted',
  codeVerified: 'Code verified',
  registered: 'Registered',
  contactsImport: 'Contacts import',
  notifications: 'Notifications',
  onboardingFinished: 'Finished',
}

export const CONTACTS_IMPORT_LABELS: Record<ContactsImportOutcome, string> = {
  success: 'Success',
  zero: 'Zero contacts',
  skipped: 'Skipped',
  denied: 'Denied',
  error: 'Error',
}

export const DURATION_LABELS: Record<DurationBucket, string> = {
  under1h: 'Under 1 h',
  '1hTo1d': '1 h to 1 d',
  '1dTo7d': '1 d to 7 d',
  over7d: 'Over 7 d',
}

export const DAYS_LABELS: Record<DaysBucket, string> = {
  d0: 'Day 0',
  d1: 'Day 1',
  d2To7: 'Days 2 to 7',
  d8To30: 'Days 8 to 30',
}

export const ACTIVATED_BY_LABELS: Record<ActivatedBy, string> = {
  offer: 'By offer',
  request: 'By request',
}

export const ACTIVATION_CLASS_LABELS: Record<ActivationClass, string> = {
  main: 'Main marketplace',
  both: 'Main and club',
  club: 'Club only',
}

export const FIRST_LOAD_LABELS: Record<FirstLoadResult, string> = {
  offers: 'Offers shown',
  empty: 'Empty',
  notLoaded: 'Not loaded',
}

export const OFFERS_VISIBLE_LABELS: Record<OffersVisibleBucket, string> = {
  '0': '0',
  '1to5': '1 to 5',
  '6to20': '6 to 20',
  '21to50': '21 to 50',
  '51plus': '51 plus',
}

export const MARKETPLACE_OPENED_LABELS: Record<
  MarketplaceOpenedBucket,
  string
> = {
  '0': '0',
  '1': '1',
  '2to5': '2 to 5',
  '6to20': '6 to 20',
  '21plus': '21 plus',
}

export const OUTCOME_LABELS: Record<JourneyOutcome, string> = {
  completed: 'Completed',
  open: 'Open',
  unknown: 'Unknown',
}
