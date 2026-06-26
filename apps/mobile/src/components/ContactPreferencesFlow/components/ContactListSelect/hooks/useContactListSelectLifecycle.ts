import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {resolveAllContactsAsSeenActionAtom} from '../../../../../state/contacts/atom/contactsStore'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useOnFocusAndAppState} from '../../../../../utils/useFocusAndAppState'
import {contactSelectMolecule} from '../atom'

export default function useContactListSelectLifecycle(): StoredContactWithComputedValues[] {
  const {
    checkContactsAccessPrivilegesActionAtom,
    syncDefaultSelectedContactsActionAtom,
    normalizedContactsAtom,
  } = useMolecule(contactSelectMolecule)
  const normalizedContacts = useAtomValue(normalizedContactsAtom)
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const checkContactsAccessPrivileges = useSetAtom(
    checkContactsAccessPrivilegesActionAtom
  )
  const syncDefaultSelectedContacts = useSetAtom(
    syncDefaultSelectedContactsActionAtom
  )

  useEffect(() => {
    return () => {
      resolveAllContactsAsSeen()
    }
  }, [resolveAllContactsAsSeen])

  useOnFocusAndAppState(
    useCallback(() => {
      Effect.runFork(checkContactsAccessPrivileges())
    }, [checkContactsAccessPrivileges])
  )

  useEffect(() => {
    syncDefaultSelectedContacts()
  }, [normalizedContacts, syncDefaultSelectedContacts])

  return normalizedContacts
}
