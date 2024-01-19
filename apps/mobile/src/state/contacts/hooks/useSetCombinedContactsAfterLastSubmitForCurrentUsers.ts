import {useAtom, useAtomValue} from 'jotai'
import {useCallback} from 'react'
import {useAppState} from '../../../utils/useAppState'
import {contactsFromDeviceAtom} from '../atom/contactsFromDeviceAtom'
import {
  combineContactsFromDeviceWithImportedContacts,
  combinedContactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'

export function useSetCombinedContactsAfterLastSubmitForCurrentUsers(): void {
  const [combinedContactsAfterLastSubmit, setCombinedContactsAfterLastSubmit] =
    useAtom(combinedContactsAfterLastSubmitAtom)
  const contactsFromDevice = useAtomValue(contactsFromDeviceAtom)
  const importedContacts = useAtomValue(importedContactsAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        if (combinedContactsAfterLastSubmit === null) {
          const combinedContacts =
            combineContactsFromDeviceWithImportedContacts({
              contactsFromDevice,
              importedContacts,
            })
          setCombinedContactsAfterLastSubmit(combinedContacts)
        }
      },
      [
        combinedContactsAfterLastSubmit,
        contactsFromDevice,
        importedContacts,
        setCombinedContactsAfterLastSubmit,
      ]
    )
  )
}
