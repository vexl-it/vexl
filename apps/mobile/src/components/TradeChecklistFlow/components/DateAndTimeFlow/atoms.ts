import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  fromDateTime,
  UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array as ArrayE, Effect, pipe, Schema} from 'effect'
import {atom, type WritableAtom} from 'jotai'
import {DateTime, type DateTimeUnit} from 'luxon'
import {type DateData} from 'react-native-calendars'
import addToSortedArray from '../../../../utils/addToSortedArray'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {
  checkIsOldDateTimeMessage,
  convertDateTimesToNewFormat,
  createAvailableDateTimeEntry,
} from './utils'

export const availableDateTimesAtom = atom<AvailableDateTimeOption[]>([])
export const availableDateTimesFromAtom = atom<UnixMilliseconds[]>([])

export const setAvailableDateTimesFromActionAtom = atom(
  (get) => get(availableDateTimesFromAtom),
  (get, set, availableDateTimes: AvailableDateTimeOption[]) => {
    const dateTimesFrom: UnixMilliseconds[] = []

    availableDateTimes.forEach((dateTime) => {
      if (dateTimesFrom.includes(dateTime.from)) return

      dateTimesFrom.push(dateTime.from)
    })

    set(
      availableDateTimesFromAtom,
      dateTimesFrom.sort((t1, t2) => t1 - t2)
    )
  }
)

export const setAvailableDateTimesActionAtom = atom(
  null,
  (get, set, dateTimes: AvailableDateTimeOption[]) => {
    // we need to convert already opened DateTime suggestions from previous versions of checklist
    const isOldChecklistDateTimeMessage = checkIsOldDateTimeMessage(dateTimes)

    if (isOldChecklistDateTimeMessage) {
      const convertedDateTimes = convertDateTimesToNewFormat(dateTimes)

      set(availableDateTimesAtom, convertedDateTimes)
      set(setAvailableDateTimesFromActionAtom, convertedDateTimes)
    } else {
      set(availableDateTimesAtom, dateTimes)
      set(setAvailableDateTimesFromActionAtom, dateTimes)
    }
  }
)

export const removeAvailableDateTimeActionAtom = atom(
  null,
  (
    get,
    set,
    {timestamp, unit}: {timestamp: UnixMilliseconds; unit: DateTimeUnit}
  ) => {
    set(availableDateTimesAtom, (prev) =>
      prev.filter(
        (entry) =>
          !DateTime.fromMillis(entry.date).hasSame(
            DateTime.fromMillis(timestamp),
            unit
          )
      )
    )
  }
)

export const uniqueAvailableDatesAtom = atom((get) => {
  const uniqueDates: UnixMilliseconds[] = []
  const availableDateTimesFrom = get(availableDateTimesFromAtom)

  availableDateTimesFrom.forEach((entry) => {
    const dateAlereadyAdded = uniqueDates.some(
      (date) =>
        DateTime.fromMillis(date).toFormat('yyyy-MM-dd') ===
        DateTime.fromMillis(entry).toFormat('yyyy-MM-dd')
    )

    if (dateAlereadyAdded) return

    uniqueDates.push(entry)
  })

  return uniqueDates.sort((ts1, ts2) => ts1 - ts2)
})

export const isThereAnyOutdatedDateTimeAtom = atom((get) => {
  const availableDateTimes = get(availableDateTimesAtom)

  return availableDateTimes.some(
    (dateTime) => dateTime.to < DateTime.now().toMillis()
  )
})

export const manageAvailableDateTimesActionAtom = atom(
  null,
  (
    get,
    set,
    {
      newTimestamp,
      previousTimestamp,
    }: {newTimestamp?: UnixMilliseconds; previousTimestamp?: UnixMilliseconds}
  ) => {
    const availableDateTimesFrom = get(availableDateTimesFromAtom)

    if (
      newTimestamp &&
      previousTimestamp &&
      availableDateTimesFrom.some((entry) => entry === previousTimestamp)
    ) {
      set(availableDateTimesFromAtom, (prev) =>
        ArrayE.replace(
          prev,
          prev.findIndex((entry) => entry === previousTimestamp),
          newTimestamp
        )
      )

      set(removeAvailableDateTimeActionAtom, {
        timestamp: previousTimestamp,
        unit: 'hour',
      })
    } else if (
      newTimestamp &&
      availableDateTimesFrom.some((entry) => entry === newTimestamp)
    ) {
      set(availableDateTimesFromAtom, (prev) =>
        prev.filter((entry) => entry !== newTimestamp)
      )
    } else if (previousTimestamp) {
      set(availableDateTimesFromAtom, (prev) =>
        prev.filter((entry) => entry !== previousTimestamp)
      )
      set(removeAvailableDateTimeActionAtom, {
        timestamp: previousTimestamp,
        unit: 'hour',
      })
    } else if (newTimestamp) {
      set(availableDateTimesFromAtom, (prev) =>
        addToSortedArray(prev, (t1, t2) => t1 - t2)(newTimestamp)
      )
    }
  }
)

export const addTimeOptionForAvailableDateActionAtom = atom(
  null,
  (get, set, date: UnixMilliseconds) => {
    const availableDateTimesFrom = get(availableDateTimesFromAtom)
    const selectedDate = DateTime.fromMillis(date).startOf('day')

    const availableDateTimesToAddTo = availableDateTimesFrom
      .filter((entry) =>
        DateTime.fromMillis(entry).startOf('day').equals(selectedDate)
      )
      .map((entry) => entry)

    const maxAvailableDateTimeInDay = Schema.decodeSync(UnixMilliseconds)(
      Math.max(...availableDateTimesToAddTo)
    )

    set(manageAvailableDateTimesActionAtom, {
      newTimestamp: Schema.decodeSync(UnixMilliseconds)(
        DateTime.fromMillis(maxAvailableDateTimeInDay)
          .plus({hour: 1})
          .toMillis()
      ),
    })
  }
)

export function createIsTimeOptionSelectedAtom(
  timestamp: UnixMilliseconds
): WritableAtom<boolean, [UnixMilliseconds], void> {
  return atom(
    (get) =>
      get(availableDateTimesAtom).some((dateTime) => dateTime.to === timestamp),
    (get, set, newTimestamp: UnixMilliseconds) => {
      const availableDateTimes = get(availableDateTimesAtom)
      const isTimestampInAvailableDateTimes = availableDateTimes.some(
        (dateTime) => dateTime.to === newTimestamp
      )

      if (isTimestampInAvailableDateTimes) {
        set(
          availableDateTimesAtom,
          availableDateTimes.filter((dateTime) => dateTime.to !== newTimestamp)
        )
      } else {
        set(
          availableDateTimesAtom,
          addToSortedArray(
            availableDateTimes,
            (t1, t2) => t1.to - t2.to
          )(createAvailableDateTimeEntry(newTimestamp))
        )
      }
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
    const availableDateTimesFrom = get(availableDateTimesFromAtom)

    if (
      availableDateTimesFrom.some((entry) =>
        DateTime.fromMillis(entry).hasSame(dateTime, 'day')
      )
    ) {
      set(availableDateTimesFromAtom, (prev) =>
        prev.filter(
          (entry) => !DateTime.fromMillis(entry).hasSame(dateTime, 'day')
        )
      )
      set(removeAvailableDateTimeActionAtom, {timestamp: millis, unit: 'day'})
    } else {
      if (DateTime.now().hasSame(DateTime.fromMillis(millis), 'day')) {
        const newTimestamp = Schema.decodeSync(UnixMilliseconds)(
          DateTime.now().startOf('hour').plus({hour: 1}).toMillis()
        )
        set(manageAvailableDateTimesActionAtom, {newTimestamp})
      } else {
        const newTimestamp = Schema.decodeSync(UnixMilliseconds)(
          DateTime.fromMillis(millis).set({hour: 12}).toMillis()
        )
        set(manageAvailableDateTimesActionAtom, {newTimestamp})
      }
    }
  }
)

export const removeTimestampFromAvailableAtom = atom(
  null,
  (get, set, timestamp: UnixMilliseconds) => {
    set(removeAvailableDateTimeActionAtom, {timestamp, unit: 'hour'})
    set(manageAvailableDateTimesActionAtom, {
      previousTimestamp: timestamp,
    })
  }
)

export const isThereAnyAvailableDateTimeSelectedAtom = atom(
  (get) => get(availableDateTimesAtom).length > 0
)

export const noDateTimeSelectedActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithText',
          title: t('tradeChecklist.dateAndTime.noTimeOptionSelected'),
          description: t(
            'tradeChecklist.dateAndTime.pleaseSelectAtLeastOneTime'
          ),
          positiveButtonText: t('common.close'),
        },
      ],
    }),
    Effect.match({
      onSuccess: () => true,
      onFailure: () => false,
    })
  )
})
