import {useMolecule} from 'bunshi/dist/react'
import {Effect, Fiber} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {resolveAllContactsAsSeenActionAtom} from '../../../../../state/contacts/atom/contactsStore'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useOnFocusAndAppState} from '../../../../../utils/useFocusAndAppState'
import {contactSelectMolecule} from '../atom'

export default function useContactListSelectLifecycle(): StoredContactWithComputedValues[] {
  const {
    importContactsFromPhoneActionAtom,
    syncDefaultSelectedContactsActionAtom,
    normalizedContactsAtom,
    loadOfferStatsActionAtom,
  } = useMolecule(contactSelectMolecule)
  const normalizedContacts = useAtomValue(normalizedContactsAtom)
  const loadOfferStats = useSetAtom(loadOfferStatsActionAtom)
  useEffect(() => {
    const fiber = Effect.runFork(loadOfferStats())
    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [loadOfferStats])
  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const importContactsFromPhone = useSetAtom(importContactsFromPhoneActionAtom)
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
      Effect.runFork(importContactsFromPhone({requestPermissions: false}))
    }, [importContactsFromPhone])
  )

  useEffect(() => {
    syncDefaultSelectedContacts()
  }, [normalizedContacts, syncDefaultSelectedContacts])

  return normalizedContacts
}
