import {useAppState} from '../../../utils/useAppState'
import {useCallback} from 'react'
import {
  combineContactsFromDeviceWithImportedContacts,
  contactsAfterLastSubmitAtom,
  importedContactsAtom,
} from '../index'
import {contactsFromDeviceAtom} from '../atom/contactsFromDeviceAtom'
import {useStore} from 'jotai'

export function useSetContactsAfterLastSubmitForCurrentUsers(): void {
  const store = useStore()

  useAppState(
    useCallback(
      (state) => {
        console.log(`!!!!!!!!!!!!!!!!! CALLBACK !!!!!!!!!!!!!!!!!`)
        if (state !== 'active') return
        if (store.get(contactsAfterLastSubmitAtom).length === 0) {
          const combinedContacts =
            combineContactsFromDeviceWithImportedContacts({
              contactsFromDevice: store.get(contactsFromDeviceAtom),
              importedContacts: store.get(importedContactsAtom),
            })
          store.set(contactsAfterLastSubmitAtom, combinedContacts)
        }
      },
      [store]
    )
  )
}
