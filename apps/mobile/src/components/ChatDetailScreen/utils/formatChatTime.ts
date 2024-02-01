import {DateTime} from 'luxon'
import {setTimezoneOfUser} from '../../../utils/unixMillisecondsToLocaleDateTime'

export default function formatChatTime(dateTime: DateTime): string {
  const now = DateTime.now()
  const dateTimeWithCorrectLocal = setTimezoneOfUser(dateTime)

  if (dateTime.hasSame(now, 'day')) {
    return setTimezoneOfUser(dateTime).toLocaleString(DateTime.TIME_24_SIMPLE)
  }

  if (dateTime.hasSame(now, 'week')) {
    return dateTimeWithCorrectLocal.toFormat('cccc')
  }

  return setTimezoneOfUser(dateTime).toLocaleString(DateTime.DATE_FULL)
}
