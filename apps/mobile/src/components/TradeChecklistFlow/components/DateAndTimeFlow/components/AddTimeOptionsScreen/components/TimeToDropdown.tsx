import {useAtom} from 'jotai'
import {useMemo} from 'react'
import {createTimeOptionAtomForTimeToDropdown} from '../../../atoms'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {DateTime} from 'luxon'
import {i18n} from '../../../../../../../utils/localization/I18nProvider'
import {
  DropdownPicker,
  type DropdownItemProps,
} from '../../../../../../DropDownPicker'

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
          .setLocale(i18n.locale)
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
    <DropdownPicker
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