import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {getCalendars} from 'expo-localization'
import {DateTime} from 'luxon'
import {getCurrentLocale} from './localization/I18nProvider'

export const usersTimeZone = getCalendars()[0]?.timeZone

export function setTimezoneOfUser(dateTime: DateTime): DateTime {
  if (usersTimeZone) {
    return dateTime.setZone(usersTimeZone).setLocale(getCurrentLocale())
  }
  return dateTime
}

export default function unixMillisecondsToLocaleDateTime(
  milisec: UnixMilliseconds
): DateTime {
  if (!usersTimeZone) {
    return DateTime.fromMillis(milisec)
  }
  return DateTime.fromMillis(milisec, {zone: usersTimeZone}).setLocale(
    getCurrentLocale()
  )
}
