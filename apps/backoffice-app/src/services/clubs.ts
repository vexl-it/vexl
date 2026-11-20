import {
  type ClubAdminInfo,
  type ClubMadeInactiveReason,
} from '@vexl-next/domain/src/general/clubs'
import {ClubCannotBeReactivatedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Option} from 'effect'
import {makeApiErrorMessage} from './apiErrorMessage'

const DAY_MS = 24 * 60 * 60 * 1000
const EXPIRES_SOON_DAYS = 30

const apiErrorMessage = makeApiErrorMessage({
  ClubAlreadyExistsError: 'A club with this UUID already exists.',
  NotFoundError: 'This club no longer exists. Reload the page.',
  S3ServiceError: 'Could not prepare the image upload. Try again.',
})

const REACTIVATION_BLOCKED: Record<
  ClubCannotBeReactivatedError['reactivationBlockedReason'],
  string
> = {
  PAST_VALIDITY:
    'The club is past its validity date. Extend "Valid until", save, then reactivate.',
  REPORT_LIMIT_REACHED:
    'The report count has reached the report limit, so the club would be deactivated again right away. Raise the report limit, save, then reactivate.',
}

export const clubsErrorMessage = (error: unknown): string =>
  error instanceof ClubCannotBeReactivatedError
    ? REACTIVATION_BLOCKED[error.reactivationBlockedReason]
    : apiErrorMessage(error)

/** Why the server would refuse to reactivate the club, if it would. */
export const reactivationBlocker = (club: ClubAdminInfo): string | null => {
  if (club.validUntil.getTime() < Date.now())
    return REACTIVATION_BLOCKED.PAST_VALIDITY
  if (club.report >= club.reportLimit)
    return REACTIVATION_BLOCKED.REPORT_LIMIT_REACHED
  return null
}

export type ClubStatus = 'active' | 'expiresSoon' | 'expired' | 'inactive'

export const daysUntil = (date: Date): number =>
  Math.ceil((date.getTime() - Date.now()) / DAY_MS)

/** `expired` is past validity but not yet deactivated by the cleanup job. */
export const clubStatus = (club: ClubAdminInfo): ClubStatus => {
  if (Option.isSome(club.madeInactiveAt)) return 'inactive'
  if (club.validUntil.getTime() < Date.now()) return 'expired'
  return daysUntil(club.validUntil) <= EXPIRES_SOON_DAYS
    ? 'expiresSoon'
    : 'active'
}

const INACTIVE_REASON_LABEL: Record<ClubMadeInactiveReason, string> = {
  EXPIRED: 'Validity ended',
  FLAGGED: 'Too many reports',
  UNKNOWN: 'Unknown reason',
}

export const inactiveReasonLabel = (club: ClubAdminInfo): string =>
  INACTIVE_REASON_LABEL[
    Option.getOrElse(
      club.madeInactiveReason,
      (): ClubMadeInactiveReason => 'UNKNOWN'
    )
  ]

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

/** `validUntil` is a UTC midnight, the same day the form's date input shows. */
export const formatUtcDay = (date: Date): string =>
  date.toLocaleDateString('en-GB', {...DATE_OPTIONS, timeZone: 'UTC'})

/** Date-only columns arrive as the server's local midnight. */
export const formatLocalDay = (date: Date): string =>
  date.toLocaleDateString('en-GB', DATE_OPTIONS)

const relativeDays = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})

export const formatDaysUntil = (date: Date): string =>
  relativeDays.format(daysUntil(date), 'day')

export const inviteLinkPath = (clubUuid: string): string =>
  `/clubs/generate-link?club=${clubUuid}`
