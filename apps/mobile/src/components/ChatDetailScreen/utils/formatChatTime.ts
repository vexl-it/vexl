import {DateTime} from 'luxon'
import {getCurrentLocale} from '../../../utils/localization/I18nProvider'
import {formatDate, formatTime} from '../../../utils/localization/formatting'
import {setTimezoneOfUser} from '../../../utils/unixMillisecondsToLocaleDateTime'

export default function formatChatTime(
  dateTime: DateTime,
  locale: string = getCurrentLocale()
): string {
  const now = DateTime.now()
  const dateTimeWithCorrectLocal = setTimezoneOfUser(dateTime)
  const dateMillis = dateTimeWithCorrectLocal.toMillis()

  if (dateTime.hasSame(now, 'day')) {
    return formatTime(dateMillis, locale)
  }

  if (dateTime.hasSame(now, 'week')) {
    return formatDate(dateMillis, locale, {weekday: 'long'})
  }

  return formatDate(dateMillis, locale, {dateStyle: 'full'})
}
