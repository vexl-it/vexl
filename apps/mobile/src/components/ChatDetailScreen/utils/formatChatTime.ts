import {DateTime} from 'luxon'
import {getCurrentLocale} from '../../../utils/localization/I18nProvider'

export default function formatChatTime(dateTime: DateTime): string {
  const now = DateTime.now()
  const dateTimeWithCorrectLocal = dateTime.setLocale(getCurrentLocale())

  if (dateTime.hasSame(now, 'day')) {
    return dateTime
      .setLocale(getCurrentLocale())
      .toLocaleString(DateTime.TIME_24_SIMPLE)
  }

  if (dateTime.hasSame(now, 'week')) {
    return dateTimeWithCorrectLocal.toFormat('cccc')
  }

  return dateTime
    .setLocale(getCurrentLocale())
    .toLocaleString(DateTime.DATE_FULL)
}
