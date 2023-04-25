import {atom, useAtomValue, useSetAtom, useStore} from 'jotai'
import {useMemo} from 'react'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {contactsToDisplayAtom} from './contactsToDisplay'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'

export const selectedContactsStorageAtom = atomWithParsedMmkvStorage(
  'selectedContacts',
  {selectedContacts: []},
  z.object({selectedContacts: z.array(E164PhoneNumber)})
)
export const selectedContactsAtom = focusAtom(
  selectedContactsStorageAtom,
  (o) => o.prop('selectedContacts')
)

export function useGetSelectedContacts(): () => E164PhoneNumber[] {
  const store = useStore()

  return () => store.get(selectedContactsAtom)
}

export const areAllContactsSelectedAtom = atom((get) => {
  const contactsToDisplay = get(contactsToDisplayAtom)
  const selectedContacts = get(selectedContactsAtom)

  return (
    !contactsToDisplay.some(
      (one) => !selectedContacts.includes(one.normalizedNumber)
    ) &&
    !selectedContacts.some(
      (one) =>
        !contactsToDisplay
          .map((toDisplay) => toDisplay.normalizedNumber)
          .includes(one)
    )
  )
})

export function useIsContactSelected(number: E164PhoneNumber): boolean {
  const isSelectedAtom = useMemo(() => {
    return atom((get) => {
      const selected = get(selectedContactsAtom)
      return selected.some((c) => c === number)
    })
  }, [number])

  return useAtomValue(isSelectedAtom)
}

export function useToggleContactSelection(): (
  selected: boolean,
  contact: E164PhoneNumber
) => void {
  const setSelectedContacts = useSetAtom(selectedContactsAtom)
  return (selected: boolean, contact: E164PhoneNumber) => {
    if (selected) {
      setSelectedContacts((old) => [contact, ...old])
    } else {
      setSelectedContacts((old) => old.filter((c) => c !== contact))
    }
  }
}

export function useSelectAll(): [boolean, (s: boolean) => void] {
  const areAllContactsSelected = useAtomValue(areAllContactsSelectedAtom)
  const contactsToDisplay = useAtomValue(contactsToDisplayAtom)
  const setSelectedContacts = useSetAtom(selectedContactsAtom)

  return [
    areAllContactsSelected,
    (selectAll: boolean) => {
      setSelectedContacts((prev) => {
        const newValue = prev.filter(
          (one) =>
            !contactsToDisplay
              .map((oneToDisplay) => oneToDisplay.normalizedNumber)
              .includes(one)
        )
        if (selectAll) {
          return [
            ...newValue,
            ...contactsToDisplay.map((one) => one.normalizedNumber),
          ]
        }
        return newValue
      })
    },
  ]
}
