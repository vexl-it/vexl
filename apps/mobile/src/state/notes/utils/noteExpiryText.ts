import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {DateTime} from 'luxon'
import {
  getLocaleFromTranslation,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
import {formatDate, formatInteger} from '../../../utils/localization/formatting'

/**
 * Builds the human readable expiry label for a note.
 *
 * The returned string is a plain snapshot for the given `now` - it is fine to
 * recompute it on every render.
 */
export function noteExpiryText(
  expiresAt: UnixMilliseconds,
  now: number,
  t: TFunction
): string {
  const expirationDateTime = DateTime.fromMillis(expiresAt)
  const nowDateTime = DateTime.fromMillis(now)
  const remainingDuration = expirationDateTime.diff(nowDateTime)
  const remainingMinutes = remainingDuration.as('minutes')

  const locale = getLocaleFromTranslation(t)

  if (remainingMinutes <= 0) {
    return t('offerForm.expiration.expiredOn', {
      expirationDate: formatDate(expiresAt, locale, {dateStyle: 'short'}),
    })
  }

  if (remainingMinutes >= 60 * 24) {
    // "Tomorrow" only replaces the day-based label. Notes expiring on the
    // next calendar day with less than 24 hours left keep the more urgent
    // hour/minute countdown below.
    if (expirationDateTime.hasSame(nowDateTime.plus({days: 1}), 'day')) {
      return t('notes.expiry.expiresTomorrow')
    }

    const days = Math.ceil(remainingMinutes / (60 * 24))
    return days === 1
      ? t('donations.expiresInOneDay')
      : t('donations.expiresInDays', {
          days: formatInteger(days, locale),
        })
  }

  if (remainingMinutes >= 60) {
    const hours = remainingDuration.shiftTo('hours', 'minutes').hours
    return hours === 1
      ? t('donations.expiresInOneHour')
      : t('donations.expiresInHours', {
          hours: formatInteger(hours, locale),
        })
  }

  const minutes = Math.max(
    1,
    remainingDuration.shiftTo('minutes', 'seconds').minutes
  )

  return minutes === 1
    ? t('donations.expiresInOneMinute')
    : t('donations.expiresIn', {
        minutes: formatInteger(minutes, locale),
      })
}
