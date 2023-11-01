import {useAtom} from 'jotai'
import {useMemo} from 'react'
import {createTimeOptionAtomForTimeFromDropdown} from '../../../atoms'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {DateTime} from 'luxon'
import {i18n} from '../../../../../../../utils/localization/I18nProvider'
import {
  DropdownPicker,
  type DropdownItemProps,
} from '../../../../../../DropDownPicker'

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
          DateTime.fromMillis(availableDateTimeFrom)
            .startOf('day')
            .plus({hour: i})
            .toMillis()
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
      timeOptionsFrom.find((option) => option.value === availableFromTimestamp)
        ?.label,
    [availableFromTimestamp, timeOptionsFrom]
  )

  return (
    <DropdownPicker
      onChange={(item) => {
        if (item.value) setAvailableFromTimestamp(item.value)
      }}
      value={{value: availableFromTimestamp, label: selectedLabel ?? ''}}
      data={timeOptionsFrom}
    />
  )
}

export default TimeFromDropdown
