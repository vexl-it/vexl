import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {type ContactsFilter} from '../../../../../state/contacts/domain'
import {contactSelectMolecule} from '../atom'

export default function usePreparedContactsFilter(): {
  readonly selectedFilter: ContactsFilter
  readonly setSelectedFilter: (contactsFilter: ContactsFilter) => void
} {
  const {contactsFilterAtom, selectContactsFilterActionAtom} = useMolecule(
    contactSelectMolecule
  )

  return {
    selectedFilter: useAtomValue(contactsFilterAtom),
    setSelectedFilter: useSetAtom(selectContactsFilterActionAtom),
  }
}
