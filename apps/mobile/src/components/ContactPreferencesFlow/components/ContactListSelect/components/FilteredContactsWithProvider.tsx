import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {
  ScrollView,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import {
  type ContactsFilter,
  type StoredContactWithComputedValues,
} from '../../../../../state/contacts/domain'
import {
  runAfterAnimationFrame,
  runAfterTwoAnimationFrames,
} from '../../../../../utils/runAfterAnimationFrames'
import {contactSelectMolecule} from '../atom'
import ContactsList from './ContactsList'

interface ContactsListSceneProps {
  readonly contactsAtom: Atom<
    ReadonlyArray<Atom<StoredContactWithComputedValues>>
  >
  readonly emptyVariant: 'noContactsInSelectedFilter' | 'noMatchingContacts'
  readonly keyboardBottomSpacerHeight: number
}

const ContactsListScene = React.memo(function ContactsListScene({
  contactsAtom,
  emptyVariant,
  keyboardBottomSpacerHeight,
}: ContactsListSceneProps): React.ReactElement {
  const contacts = useAtomValue(contactsAtom)

  return (
    <Stack f={1} px="$5">
      <ContactsList
        contacts={contacts}
        emptyVariant={emptyVariant}
        keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
      />
    </Stack>
  )
})

const PAGE_SNAP_TOLERANCE = 0.01

function getSettledPageIndex(
  offsetX: number,
  pageWidth: number
): number | undefined {
  const page = offsetX / pageWidth
  const pageIndex = Math.round(page)
  return Math.abs(page - pageIndex) <= PAGE_SNAP_TOLERANCE
    ? pageIndex
    : undefined
}

function FilteredContacts({
  filters,
  onFilterChange,
  keyboardBottomSpacerHeight,
}: {
  readonly filters: readonly ContactsFilter[]
  readonly onFilterChange: (filter: ContactsFilter) => void
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
  const {width: pageWidth} = useWindowDimensions()
  const scrollViewRef = useRef<ScrollView>(null)
  const settledOffsetXRef = useRef(0)
  const selectedOffsetX =
    pipe(
      filters,
      Array.findFirstIndex((filter) => filter === contactsFilter),
      Option.getOrElse(() => 0)
    ) * pageWidth

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

  useEffect(() => {
    if (settledOffsetXRef.current === selectedOffsetX) return

    settledOffsetXRef.current = selectedOffsetX
    scrollViewRef.current?.scrollTo({x: selectedOffsetX, animated: false})
  }, [selectedOffsetX])

  const handleScrollSettled = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const pageIndex = getSettledPageIndex(offsetX, pageWidth)
      if (pageIndex === undefined) return

      const filter = filters[pageIndex]
      if (filter === undefined) return

      settledOffsetXRef.current = pageIndex * pageWidth
      onFilterChange(filter)
    },
    [filters, onFilterChange, pageWidth]
  )

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // A moving release keeps paging and settles in onMomentumScrollEnd.
      if (event.nativeEvent.velocity?.x !== 0) return

      handleScrollSettled(event)
    },
    [handleScrollSettled]
  )

  const contactsAtomByFilter = {
    all: allContactsToDisplayAtomsAtom,
    new: newContactsToDisplayAtomsAtom,
    submitted: submittedContactsToDisplayAtomsAtom,
    nonSubmitted: nonSubmittedContactsToDisplayAtomsAtom,
  } satisfies Record<ContactsFilter, unknown>

  const emptyVariant =
    searchText.trim().length === 0
      ? 'noContactsInSelectedFilter'
      : 'noMatchingContacts'

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      pagingEnabled
      bounces={false}
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollEnd={handleScrollSettled}
    >
      {pipe(
        filters,
        Array.map((filter) => {
          const isActive = filter === contactsFilter

          return (
            <Stack
              key={filter}
              width={pageWidth}
              aria-hidden={!isActive}
              importantForAccessibility={
                isActive ? 'auto' : 'no-hide-descendants'
              }
            >
              {isActive || shouldMountInactiveScenes ? (
                <ContactsListScene
                  contactsAtom={contactsAtomByFilter[filter]}
                  emptyVariant={emptyVariant}
                  keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
                />
              ) : null}
            </Stack>
          )
        })
      )}
    </ScrollView>
  )
}

export default React.memo(FilteredContacts)
