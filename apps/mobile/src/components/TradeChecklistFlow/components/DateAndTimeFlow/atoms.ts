import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  fromDateTime,
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {DateTime} from 'luxon'
import {type DateData} from 'react-native-calendars'
import addToSortedArray from '../../../../utils/addToSortedArray'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import unixMillisecondsToLocaleDateTime from '../../../../utils/unixMillisecondsToLocaleDateTime'

export const availableDateTimesAtom = atom<AvailableDateTimeOption[]>([])

export function createTimeOptionAtomForTimeToDropdown(
  timestampTo: UnixMilliseconds
): WritableAtom<UnixMilliseconds, [SetStateAction<UnixMilliseconds>], void> {
  return atom(
    (get) =>
      get(availableDateTimesAtom).find(
        (dateTime) => dateTime.to === timestampTo
      )?.to ?? unixMillisecondsNow(),
    (get, set, selectedTimeTo: SetStateAction<UnixMilliseconds>) => {
      const availableDateTimes = get(availableDateTimesAtom)
      const selectedDateTime = getValueFromSetStateActionOfAtom(selectedTimeTo)(
        () =>
          get(availableDateTimesAtom).find(
            (dateTime) => dateTime.to === selectedTimeTo
          )?.to ?? unixMillisecondsNow()
      )

      const dateTimeToChange = availableDateTimes.find((dateTime) =>
        unixMillisecondsToLocaleDateTime(dateTime.to).hasSame(
          unixMillisecondsToLocaleDateTime(selectedDateTime),
          'day'
        )
      )

      set(
        availableDateTimesAtom,
        availableDateTimes.map((dateTime) =>
          dateTime.to === dateTimeToChange?.to
            ? {...dateTime, to: selectedDateTime}
            : dateTime
        )
      )
    }
  )
}

export function createTimeOptionAtomForTimeFromDropdown(
  timestamp: UnixMilliseconds
): WritableAtom<UnixMilliseconds, [SetStateAction<UnixMilliseconds>], void> {
  return atom(
    (get) =>
      get(availableDateTimesAtom).find(
        (dateTime) => dateTime.from === timestamp
      )?.from ?? unixMillisecondsNow(),
    (get, set, selectedTimeFrom: SetStateAction<UnixMilliseconds>) => {
      const availableDateTimes = get(availableDateTimesAtom)
      const selectedDateTime = getValueFromSetStateActionOfAtom(
        selectedTimeFrom
      )(
        () =>
          get(availableDateTimesAtom).find(
            (dateTime) => dateTime.from === selectedTimeFrom
          )?.from ?? unixMillisecondsNow()
      )

      const dateTimeToChange = availableDateTimes.find((dateTime) =>
        unixMillisecondsToLocaleDateTime(dateTime.from).hasSame(
          unixMillisecondsToLocaleDateTime(selectedDateTime),
          'day'
        )
      )

      set(
        availableDateTimesAtom,
        availableDateTimes.map((dateTime) =>
          dateTime.from === dateTimeToChange?.from
            ? {
                ...dateTime,
                from: selectedDateTime,
                to:
                  dateTime.to < selectedDateTime
                    ? selectedDateTime
                    : dateTime.to,
              }
            : dateTime
        )
      )
    }
  )
}

export const handleAvailableDaysChangeActionAtom = atom(
  null,
  (get, set, day: DateData) => {
    const dateTime = DateTime.fromObject({
      year: day.year,
      month: day.month,
      day: day.day,
    })
    const millis = fromDateTime(dateTime)
    const availableDateTimes = get(availableDateTimesAtom)

    if (availableDateTimes.some((dateTime) => dateTime.date === millis)) {
      set(
        availableDateTimesAtom,
        availableDateTimes.filter(
          (availableDateTime) => availableDateTime.date !== millis
        )
      )
    } else {
      set(
        availableDateTimesAtom,
        addToSortedArray(
          availableDateTimes,
          (t1, t2) => t1.date - t2.date
        )({
          from: fromDateTime(dateTime.startOf('day').plus({hour: 12})),
          to: fromDateTime(dateTime.startOf('day').plus({hour: 13})),
          date: millis,
        })
      )
    }
  }
)

export const removeTimestampFromAvailableAtom = atom(
  null,
  (get, set, date: UnixMilliseconds) => {
    const availableDateTimes = get(availableDateTimesAtom)
    set(
      availableDateTimesAtom,
      availableDateTimes.filter((dateTime) => dateTime.date !== date)
    )
  }
)
