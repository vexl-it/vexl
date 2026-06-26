import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {runAfterAnimationFrame} from '../../../../../utils/runAfterAnimationFrames'
import {contactSelectMolecule} from '../atom'
import ContactsList from './ContactsList'

function FilteredContacts({
  keyboardBottomSpacerHeight,
}: {
  readonly keyboardBottomSpacerHeight: number
}): React.ReactElement {
  const {
    contactsFilterAtom,
    searchTextAtom,
    readyContactsQueryAtom,
    contactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsFilter = useAtomValue(contactsFilterAtom)
  const searchText = useAtomValue(searchTextAtom)
  const toDisplay = useAtomValue(contactsToDisplayAtomsAtom)
  const setReadyContactsQuery = useSetAtom(readyContactsQueryAtom)

  useEffect(() => {
    return runAfterAnimationFrame(() => {
      setReadyContactsQuery({contactsFilter, searchText})
    })
  }, [contactsFilter, searchText, setReadyContactsQuery, toDisplay])
  const emptyVariant =
    searchText.trim().length === 0
      ? 'noContactsInSelectedFilter'
      : 'noMatchingContacts'

  return (
    <Stack f={1}>
      <Stack f={1} px="$5">
        <ContactsList
          contacts={toDisplay}
          emptyVariant={emptyVariant}
          keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
        />
      </Stack>
    </Stack>
  )
}

export default FilteredContacts
