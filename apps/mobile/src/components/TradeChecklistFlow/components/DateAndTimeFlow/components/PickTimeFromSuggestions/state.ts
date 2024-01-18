import type {AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import type {Item as OptionsListItem} from '../OptionsList'
import {DateTime} from 'luxon'
import {atom, type Atom, useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {splitAtom} from 'jotai/utils'

function generateHoursList(
  forOption: AvailableDateTimeOption
): Array<OptionsListItem<DateTime>> {
  const from = DateTime.fromMillis(forOption.from).startOf('hour')
  const to = DateTime.fromMillis(forOption.to).startOf('hour')

  const hoursInBetween = to.diff(from).as('hours')

  return Array(hoursInBetween)
    .fill(0)
    .map((_, index) => {
      const dateTime = from.plus({hours: index})
      return {
        data: dateTime,
        key: dateTime.toString(),
        title: dateTime.toLocaleString(DateTime.TIME_SIMPLE),
        selected: false,
      }
    })
}

export function useState(chosenDay: AvailableDateTimeOption): {
  itemsAtoms: Array<Atom<OptionsListItem<DateTime>>>
  selectItem: (val: DateTime) => void
  selectedItem: OptionsListItem<DateTime> | undefined
} {
  const atoms = useMemo(() => {
    const initialValue = generateHoursList(chosenDay)

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
  }, [chosenDay])

  return {
    itemsAtoms: useAtomValue(atoms.itemsAtomsAtom),
    selectItem: useSetAtom(atoms.selectItemActionAtom),
    selectedItem: useAtomValue(atoms.selectedItemAtom),
  }
}
