import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import unixMillisecondsToLocaleDateTime from '../../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {Dropdown, type DropdownItemProps} from '../../../../../../Dropdown'
import {createTimeOptionAtomForTimeToDropdown} from '../../../atoms'

interface Props {
  availableDateTimeFrom: UnixMilliseconds
  availableDateTimeTo: UnixMilliseconds
}

function TimeToDropdown({
  availableDateTimeFrom,
  availableDateTimeTo,
}: Props): JSX.Element {
  const [availableToTimestamp, setAvailableToTimestamp] = useAtom(
    useMemo(
      () => createTimeOptionAtomForTimeToDropdown(availableDateTimeTo),
      [availableDateTimeTo]
    )
  )

  const timeOptionsTo: Array<DropdownItemProps<UnixMilliseconds>> =
    useMemo(() => {
      const options: Array<DropdownItemProps<UnixMilliseconds>> = []
      const numberOfHoursTillMidnight = Math.round(
        unixMillisecondsToLocaleDateTime(availableDateTimeFrom)
          .endOf('day')
          .diff(
            unixMillisecondsToLocaleDateTime(availableDateTimeFrom).startOf(
              'hour'
            ),
            'hours'
          ).hours
      )

      // Start from 1 to not allow user to choose the same time as available from (which would result in 0 hours of trade ex.: 12:00 - 12:00)
      for (let i = 1; i < numberOfHoursTillMidnight; i++) {
        const timeOptionMillis = UnixMilliseconds.parse(
          unixMillisecondsToLocaleDateTime(availableDateTimeFrom)
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
      timeOptionsTo.find((option) => option.value === availableToTimestamp)
        ?.label,
    [availableToTimestamp, timeOptionsTo]
  )

  return (
    <Dropdown
      placeholder=""
      onChange={(item) => {
        if (item.value) setAvailableToTimestamp(item.value)
      }}
      value={{value: availableToTimestamp, label: selectedLabel ?? ''}}
      data={timeOptionsTo}
    />
  )
}

export default TimeToDropdown
