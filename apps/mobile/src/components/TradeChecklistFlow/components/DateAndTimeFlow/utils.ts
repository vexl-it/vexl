import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {DateTime} from 'luxon'

export function createAvailableDateTimeEntry(
  timestamp: UnixMilliseconds
): AvailableDateTimeOption {
  return {
    from: Schema.decodeSync(UnixMilliseconds)(
      DateTime.fromMillis(timestamp).startOf('hour').toMillis()
    ),
    to: timestamp,
    date: Schema.decodeSync(UnixMilliseconds)(
      DateTime.fromMillis(timestamp).startOf('day').toMillis()
    ),
  }
}

export function checkIsOldDateTimeMessage(
  availableDateTimeOptions: AvailableDateTimeOption[]
): boolean {
  return availableDateTimeOptions.some(
    (dateTime) =>
      DateTime.fromMillis(dateTime.to).diff(
        DateTime.fromMillis(dateTime.from),
        'hours'
      ).hours >= 1
  )
}

export function convertDateTimesToNewFormat(
  availableDateTimeOptions: AvailableDateTimeOption[]
): AvailableDateTimeOption[] {
  return availableDateTimeOptions.flatMap((dateTime) => {
    const diffInMinutes = DateTime.fromMillis(dateTime.to).diff(
      DateTime.fromMillis(dateTime.from),
      'minutes'
    ).minutes

    const splitIntervals: AvailableDateTimeOption[] = []
    for (let i = 0; i < diffInMinutes; i += 15) {
      const timeOptionMillis = Schema.decodeSync(UnixMilliseconds)(
        DateTime.fromMillis(dateTime.from).plus({minutes: i}).toMillis()
      )

      splitIntervals.push(createAvailableDateTimeEntry(timeOptionMillis))
    }

    return splitIntervals
  })
}
