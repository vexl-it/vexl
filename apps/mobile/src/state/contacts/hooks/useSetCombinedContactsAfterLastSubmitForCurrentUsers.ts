import {useAppState} from '../../../utils/useAppState'
import {useCallback} from 'react'
import {
  combineContactsFromDeviceWithImportedContacts,
  combinedContactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'
import {contactsFromDeviceAtom} from '../atom/contactsFromDeviceAtom'
import {useAtom, useAtomValue} from 'jotai'

export function useSetCombinedContactsAfterLastSubmitForCurrentUsers(): void {
  const [combinedContactsAfterLastSubmit, setCombinedContactsAfterLastSubmit] =
    useAtom(combinedContactsAfterLastSubmitAtom)
  const contactsFromDevice = useAtomValue(contactsFromDeviceAtom)
  const importedContacts = useAtomValue(importedContactsAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        if (combinedContactsAfterLastSubmit.length === 0) {
          const combinedContacts =
            combineContactsFromDeviceWithImportedContacts({
              contactsFromDevice,
              importedContacts,
            })
          setCombinedContactsAfterLastSubmit(combinedContacts)
        }
      },
      [
        combinedContactsAfterLastSubmit.length,
        contactsFromDevice,
        importedContacts,
        setCombinedContactsAfterLastSubmit,
      ]
    )
  )
}
