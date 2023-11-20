import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {useAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import {getCurrentLocale} from '../../../../../../../utils/localization/I18nProvider'
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
        DateTime.fromMillis(availableDateTimeFrom)
          .endOf('day')
          .diff(
            DateTime.fromMillis(availableDateTimeFrom).startOf('hour'),
            'hours'
          ).hours
      )

      for (let i = 0; i < numberOfHoursTillMidnight; i++) {
        const timeOptionMillis = UnixMilliseconds.parse(
          DateTime.fromMillis(availableDateTimeFrom).plus({hour: i}).toMillis()
        )
        const timeOptionString = DateTime.fromMillis(timeOptionMillis)
          .setLocale(getCurrentLocale())
          .toLocaleString(DateTime.TIME_SIMPLE)

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
      placeholder={''}
      onChange={(item) => {
        if (item.value) setAvailableToTimestamp(item.value)
      }}
      value={{value: availableToTimestamp, label: selectedLabel ?? ''}}
      data={timeOptionsTo}
    />
  )
}

export default TimeToDropdown
