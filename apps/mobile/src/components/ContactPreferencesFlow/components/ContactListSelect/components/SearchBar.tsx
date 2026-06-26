import {SearchBar} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {atom, useSetAtom, useStore} from 'jotai'
import React, {useEffect, useMemo, useRef} from 'react'
import {debounce} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {runAfterAnimationFrame} from '../../../../../utils/runAfterAnimationFrames'
import {contactSelectMolecule} from '../atom'

const SEARCH_CONTACTS_DEBOUNCE_MS = 500

function ContactSearchBar({
  addContactRequestId,
}: {
  readonly addContactRequestId: number
}): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const {searchTextAtom, requestedSearchTextAtom} = useMolecule(
    contactSelectMolecule
  )
  const setSearchText = useSetAtom(searchTextAtom)
  const setRequestedSearchText = useSetAtom(requestedSearchTextAtom)

  const setSearchTextRef = useRef(setSearchText)
  setSearchTextRef.current = setSearchText
  const setRequestedSearchTextRef = useRef(setRequestedSearchText)
  setRequestedSearchTextRef.current = setRequestedSearchText

  const cancelDeferredSearchFrameRef = useRef<(() => void) | undefined>(
    undefined
  )
  const applySearchTextRef = useRef<(text: string) => void>(() => {})
  applySearchTextRef.current = (text) => {
    const alreadyApplied = store.get(searchTextAtom) === text

    setRequestedSearchTextRef.current(text)

    if (alreadyApplied) return

    cancelDeferredSearchFrameRef.current?.()
    cancelDeferredSearchFrameRef.current = runAfterAnimationFrame(() => {
      cancelDeferredSearchFrameRef.current = undefined
      setSearchTextRef.current(text)
    })
  }

  const debouncedSetSearchTextRef = useRef(
    debounce((text: string) => {
      applySearchTextRef.current(text)
    }, SEARCH_CONTACTS_DEBOUNCE_MS)
  )

  useEffect(() => {
    const debouncedSetSearchText = debouncedSetSearchTextRef.current

    return () => {
      debouncedSetSearchText.cancel()
      cancelDeferredSearchFrameRef.current?.()
    }
  }, [])

  const searchInputAtom = useMemo(() => {
    const inputAtom = atom(store.get(searchTextAtom))

    return atom(
      (get) => get(inputAtom),
      (get, set, update: React.SetStateAction<string>) => {
        const previousValue = get(inputAtom)
        const nextValue =
          typeof update === 'function' ? update(previousValue) : update

        set(inputAtom, nextValue)

        const nextSearchText = nextValue.trim() === '' ? '' : nextValue
        const alreadyApplied = store.get(searchTextAtom) === nextSearchText

        cancelDeferredSearchFrameRef.current?.()
        cancelDeferredSearchFrameRef.current = undefined

        if (alreadyApplied) {
          debouncedSetSearchTextRef.current.cancel()
          setRequestedSearchText(nextSearchText)
        } else {
          setRequestedSearchText(store.get(searchTextAtom))
          debouncedSetSearchTextRef.current(nextSearchText)
        }
      }
    )
  }, [searchTextAtom, setRequestedSearchText, store])

  return (
    <SearchBar
      key={addContactRequestId}
      autoFocus={addContactRequestId > 0}
      testID="@searchBar/contactInput"
      valueAtom={searchInputAtom}
      placeholder={t('common.search')}
    />
  )
}

export default ContactSearchBar
