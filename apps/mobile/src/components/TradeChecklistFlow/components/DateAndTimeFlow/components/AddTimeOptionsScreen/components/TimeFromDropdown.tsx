import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {getTokens} from 'tamagui'
import unixMillisecondsToLocaleDateTime from '../../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {Dropdown, type DropdownItemProps} from '../../../../../../Dropdown'
import {
  availableDateTimesFromAtom,
  manageAvailableDateTimesActionAtom,
} from '../../../atoms'

interface Props {
  availableDateTimeFrom: UnixMilliseconds
}

function createTimeOptionsFromData(
  availableDateTimeFrom: UnixMilliseconds,
  alreadySelectedDateTimesFrom: UnixMilliseconds[]
): Array<DropdownItemProps<UnixMilliseconds>> {
  const options: Array<DropdownItemProps<UnixMilliseconds>> = []

  for (let i = 0; i < 24; i++) {
    const timeOptionMillis = UnixMilliseconds.parse(
      unixMillisecondsToLocaleDateTime(availableDateTimeFrom)
        .startOf('day')
        .plus({hour: i})
        .toMillis()
    )

    if (
      !alreadySelectedDateTimesFrom.includes(timeOptionMillis) &&
      timeOptionMillis > DateTime.now().toMillis()
    ) {
      const timeOptionString = unixMillisecondsToLocaleDateTime(
        timeOptionMillis
      ).toLocaleString(DateTime.TIME_SIMPLE)

      options.push({
        label: timeOptionString,
        value: timeOptionMillis,
      })
    }
  }

  return options
}

function TimeFromDropdown({availableDateTimeFrom}: Props): React.ReactElement {
  const availableDateTimesFrom = useAtomValue(availableDateTimesFromAtom)
  const manageAvailableDateTimes = useSetAtom(
    manageAvailableDateTimesActionAtom
  )

  const timeOptionsFrom: Array<DropdownItemProps<UnixMilliseconds>> = useMemo(
    () =>
      createTimeOptionsFromData(availableDateTimeFrom, availableDateTimesFrom),
    [availableDateTimeFrom, availableDateTimesFrom]
  )

  const selectedLabel = useMemo(
    () =>
      unixMillisecondsToLocaleDateTime(availableDateTimeFrom).toLocaleString(
        DateTime.TIME_SIMPLE
      ),
    [availableDateTimeFrom]
  )

  return (
    <Dropdown
      onChange={(item) => {
        manageAvailableDateTimes({
          newTimestamp: item.value,
          previousTimestamp: availableDateTimeFrom,
        })
      }}
      value={{
        value: availableDateTimeFrom,
        label: selectedLabel,
      }}
      data={timeOptionsFrom}
      placeholder={selectedLabel}
      placeholderStyle={{color: getTokens().color.white.val}}
    />
  )
}

export default React.memo(TimeFromDropdown)
