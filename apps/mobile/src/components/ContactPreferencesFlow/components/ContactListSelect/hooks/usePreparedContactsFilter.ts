import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {type ContactsFilter} from '../../../../../state/contacts/domain'
import {contactSelectMolecule} from '../atom'

export default function usePreparedContactsFilter(
  filter: ContactsFilter | undefined
): {
  readonly selectedFilter: ContactsFilter
  readonly setSelectedFilter: (contactsFilter: ContactsFilter) => void
} {
  const {contactsFilterAtom, resetContactsFilterFromRouteActionAtom} =
    useMolecule(contactSelectMolecule)
  const selectedFilter = useAtomValue(contactsFilterAtom)
  const setSelectedFilter = useSetAtom(resetContactsFilterFromRouteActionAtom)
  useEffect(() => {
    setSelectedFilter(filter ?? 'all')
  }, [filter, setSelectedFilter])

  return {
    selectedFilter,
    setSelectedFilter,
  }
}
