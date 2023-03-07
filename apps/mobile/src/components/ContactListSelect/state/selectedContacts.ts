import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {contactsToDisplayAtom} from './contactsToDisplay'
import {atomWithParsedAsyncStorage} from '../../../utils/atomWithParsedAsyncStorage'
import {z} from 'zod'
import * as O from 'fp-ts/Option'

export const selectedContactsAtom = atomWithParsedAsyncStorage(
  'selectedContacts',
  [],
  z.array(E164PhoneNumber)
)

export const selectedContactsAtomOrEmptyArray = atom((get) => {
  const selectedContacts = get(selectedContactsAtom)
  return O.getOrElse(() => [] as E164PhoneNumber[])(selectedContacts)
})

export const areAllContactsSelectedAtom = atom((get) => {
  const contactsToDisplay = get(contactsToDisplayAtom)
  const selectedContacts = get(selectedContactsAtomOrEmptyArray)

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
      const selected = get(selectedContactsAtomOrEmptyArray)
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
      setSelectedContacts((old) => [
        contact,
        ...O.getOrElse(() => [] as E164PhoneNumber[])(old),
      ])
    } else {
      setSelectedContacts((old) =>
        O.getOrElse(() => [] as E164PhoneNumber[])(old).filter(
          (c) => c !== contact
        )
      )
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
        const newValue = O.getOrElse(() => [] as E164PhoneNumber[])(
          prev
        ).filter(
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
