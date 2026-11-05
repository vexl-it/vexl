import type {AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {Array, pipe} from 'effect'
import {DateTime} from 'luxon'
import {
  formatTime,
  type FormattingLocale,
} from '../../../../../../utils/localization/formatting'
import unixMillisecondsToLocaleDateTime from '../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {
  checkIsOldDateTimeMessage,
  convertDateTimesToNewFormat,
} from '../../utils'

export interface TimeOption {
  readonly data: DateTime
  readonly key: string
  readonly outdated: boolean
  readonly title: string
}

export function generateTimeOptions(
  fromOptions: AvailableDateTimeOption[],
  forOption: AvailableDateTimeOption,
  locale: FormattingLocale
): readonly TimeOption[] {
  // TODO: remove this logic once all devices update to new checklist DateTime format
  const from = checkIsOldDateTimeMessage(fromOptions)
    ? convertDateTimesToNewFormat(fromOptions)
    : fromOptions

  return pipe(
    from,
    Array.filter((option) => option.date === forOption.date),
    Array.map((option) => {
      const dateTime = unixMillisecondsToLocaleDateTime(option.to)
      return {
        data: dateTime,
        key: dateTime.toString(),
        outdated: dateTime.toMillis() < DateTime.now().toMillis(),
        title: formatTime(dateTime.toMillis(), locale),
      }
    })
  )
}
