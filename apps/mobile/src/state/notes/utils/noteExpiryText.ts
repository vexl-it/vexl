import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type TFunction} from '../../../utils/localization/I18nProvider'

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

function padTwo(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * Builds the human readable expiry label for a note.
 *
 * The returned string is a plain snapshot for the given `now` - it is fine to
 * recompute it on every render (the sub-day countdown ticks as the parent
 * re-renders).
 */
export function noteExpiryText(
  expiresAt: UnixMilliseconds,
  now: number,
  t: TFunction
): string {
  const remaining = expiresAt - now

  if (remaining <= 0) {
    return t('notes.expiry.expired')
  }

  if (remaining >= MILLISECONDS_IN_DAY) {
    const days = Math.ceil(remaining / MILLISECONDS_IN_DAY)
    return days === 1
      ? t('notes.expiry.expiresInOneDay')
      : t('notes.expiry.expiresInDays', {count: days})
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const time = `${padTwo(hours)}:${padTwo(minutes)}:${padTwo(seconds)}`

  return t('notes.expiry.expiresIn', {time})
}
