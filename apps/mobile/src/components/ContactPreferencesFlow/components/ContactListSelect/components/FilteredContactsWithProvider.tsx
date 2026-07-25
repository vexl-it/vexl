import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {
  runAfterAnimationFrame,
  runAfterTwoAnimationFrames,
} from '../../../../../utils/runAfterAnimationFrames'
import RetainedScene from '../../../../RetainedScene'
import {contactSelectMolecule} from '../atom'
import ContactsList from './ContactsList'

interface ContactsListSceneProps {
  readonly contactsAtom: Atom<
    ReadonlyArray<Atom<StoredContactWithComputedValues>>
  >
  readonly emptyVariant: 'noContactsInSelectedFilter' | 'noMatchingContacts'
  readonly isActive: boolean
  readonly keyboardBottomSpacerHeight: number
}

const ContactsListScene = React.memo(function ContactsListScene({
  contactsAtom,
  emptyVariant,
  isActive,
  keyboardBottomSpacerHeight,
}: ContactsListSceneProps): React.ReactElement {
  const contacts = useAtomValue(contactsAtom)

  return (
    <Stack f={1} px="$5">
      <ContactsList
        contacts={contacts}
        emptyVariant={emptyVariant}
        isActive={isActive}
        keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
      />
    </Stack>
  )
})

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
    allContactsToDisplayAtomsAtom,
    newContactsToDisplayAtomsAtom,
    submittedContactsToDisplayAtomsAtom,
    nonSubmittedContactsToDisplayAtomsAtom,
  } = useMolecule(contactSelectMolecule)
  const contactsFilter = useAtomValue(contactsFilterAtom)
  const searchText = useAtomValue(searchTextAtom)
  const toDisplay = useAtomValue(contactsToDisplayAtomsAtom)
  const setReadyContactsQuery = useSetAtom(readyContactsQueryAtom)
  const [shouldMountInactiveScenes, setShouldMountInactiveScenes] =
    useState(false)

  useEffect(() => {
    return runAfterAnimationFrame(() => {
      setReadyContactsQuery({contactsFilter, searchText})
    })
  }, [contactsFilter, searchText, setReadyContactsQuery, toDisplay])

  useEffect(() => {
    return runAfterTwoAnimationFrames(() => {
      setShouldMountInactiveScenes(true)
    })
  }, [])

  const emptyVariant =
    searchText.trim().length === 0
      ? 'noContactsInSelectedFilter'
      : 'noMatchingContacts'

  return (
    <Stack f={1} pos="relative">
      {contactsFilter === 'all' || shouldMountInactiveScenes ? (
        <RetainedScene isActive={contactsFilter === 'all'}>
          <ContactsListScene
            contactsAtom={allContactsToDisplayAtomsAtom}
            emptyVariant={emptyVariant}
            isActive={contactsFilter === 'all'}
            keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
          />
        </RetainedScene>
      ) : null}
      {contactsFilter === 'new' || shouldMountInactiveScenes ? (
        <RetainedScene isActive={contactsFilter === 'new'}>
          <ContactsListScene
            contactsAtom={newContactsToDisplayAtomsAtom}
            emptyVariant={emptyVariant}
            isActive={contactsFilter === 'new'}
            keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
          />
        </RetainedScene>
      ) : null}
      {contactsFilter === 'submitted' || shouldMountInactiveScenes ? (
        <RetainedScene isActive={contactsFilter === 'submitted'}>
          <ContactsListScene
            contactsAtom={submittedContactsToDisplayAtomsAtom}
            emptyVariant={emptyVariant}
            isActive={contactsFilter === 'submitted'}
            keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
          />
        </RetainedScene>
      ) : null}
      {contactsFilter === 'nonSubmitted' || shouldMountInactiveScenes ? (
        <RetainedScene isActive={contactsFilter === 'nonSubmitted'}>
          <ContactsListScene
            contactsAtom={nonSubmittedContactsToDisplayAtomsAtom}
            emptyVariant={emptyVariant}
            isActive={contactsFilter === 'nonSubmitted'}
            keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
          />
        </RetainedScene>
      ) : null}
    </Stack>
  )
}

export default React.memo(FilteredContacts)
