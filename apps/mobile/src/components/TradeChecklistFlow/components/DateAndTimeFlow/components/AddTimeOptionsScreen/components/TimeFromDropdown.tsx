import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import unixMillisecondsToLocaleDateTime from '../../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {Dropdown, type DropdownItemProps} from '../../../../../../Dropdown'
import {createTimeOptionAtomForTimeFromDropdown} from '../../../atoms'

interface Props {
  availableDateTimeFrom: UnixMilliseconds
}

function TimeFromDropdown({availableDateTimeFrom}: Props): JSX.Element {
  const [availableFromTimestamp, setAvailableFromTimestamp] = useAtom(
    useMemo(
      () => createTimeOptionAtomForTimeFromDropdown(availableDateTimeFrom),
      [availableDateTimeFrom]
    )
  )

  const timeOptionsFrom: Array<DropdownItemProps<UnixMilliseconds>> =
    useMemo(() => {
      const options: Array<DropdownItemProps<UnixMilliseconds>> = []

      for (let i = 0; i < 24; i++) {
        const timeOptionMillis = UnixMilliseconds.parse(
          unixMillisecondsToLocaleDateTime(availableDateTimeFrom)
            .startOf('day')
            .plus({hour: i})
            .toMillis()
        )
        const timeOptionString = unixMillisecondsToLocaleDateTime(
          timeOptionMillis
        ).toLocaleString(DateTime.TIME_SIMPLE)

        options.push({
          label: timeOptionString,
          value: timeOptionMillis,
        })
      }

      return options
    }, [availableDateTimeFrom])

  const selectedLabel = useMemo(
    () =>
      timeOptionsFrom.find((option) => option.value === availableFromTimestamp)
        ?.label,
    [availableFromTimestamp, timeOptionsFrom]
  )

  return (
    <Dropdown
      onChange={(item) => {
        if (item.value) setAvailableFromTimestamp(item.value)
      }}
      value={{value: availableFromTimestamp, label: selectedLabel ?? ''}}
      data={timeOptionsFrom}
    />
  )
}

export default TimeFromDropdown
