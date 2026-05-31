import type {AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {atom, useAtomValue, useSetAtom, type Atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import {useMemo} from 'react'
import {formatTime} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import unixMillisecondsToLocaleDateTime from '../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {
  checkIsOldDateTimeMessage,
  convertDateTimesToNewFormat,
} from '../../utils'
import type {Item as OptionsListItem} from '../OptionsList'

function generateHoursList(
  fromOptions: AvailableDateTimeOption[],
  forOption: AvailableDateTimeOption,
  locale: string
): Array<OptionsListItem<DateTime>> {
  // TODO: remove this logic once all devices update to new checklist DateTime format
  const isOldChecklistDateTimeMessage = checkIsOldDateTimeMessage(fromOptions)
  const from = isOldChecklistDateTimeMessage
    ? convertDateTimesToNewFormat(fromOptions)
    : fromOptions
  const optionsToShow = from
    .filter((option) => option.date === forOption.date)
    .map((option) => unixMillisecondsToLocaleDateTime(option.to))

  return optionsToShow.map((option, index) => {
    return {
      data: option,
      key: option.toString(),
      outdated: option.toMillis() < DateTime.now().toMillis(),
      title: formatTime(option.toMillis(), locale),
      selected: false,
    }
  })
}

export function useState(
  chosenDayTimes: AvailableDateTimeOption[],
  pickedOption: AvailableDateTimeOption
): {
  itemsAtoms: Array<Atom<OptionsListItem<DateTime>>>
  selectItem: (val: DateTime) => void
  selectedItem: OptionsListItem<DateTime> | undefined
} {
  const locale = useAtomValue(formattingLocaleAtom)
  const atoms = useMemo(() => {
    const initialValue = generateHoursList(chosenDayTimes, pickedOption, locale)

    const itemAtoms = atom(initialValue)
    const selectItemActionAtom = atom(null, (get, set, item: DateTime) => {
      set(itemAtoms, (prev) => {
        return prev.map((prevItem) => {
          if (!prevItem.selected && !prevItem.data.equals(item)) return prevItem

          return {
            ...prevItem,
            selected: prevItem.data.equals(item),
          }
        })
      })
    })

    const selectedItemAtom = atom((get) =>
      get(itemAtoms).find((item) => item.selected)
    )

    return {
      itemsAtomsAtom: splitAtom(itemAtoms),
      selectItemActionAtom,
      selectedItemAtom,
    }
  }, [chosenDayTimes, pickedOption, locale])

  return {
    itemsAtoms: useAtomValue(atoms.itemsAtomsAtom),
    selectItem: useSetAtom(atoms.selectItemActionAtom),
    selectedItem: useAtomValue(atoms.selectedItemAtom),
  }
}
