import {SearchBar} from '@vexl-next/ui'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef} from 'react'
import {
  searchTextAtom,
  submitSearchActionAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {runAfterTwoAnimationFrames} from '../../../../../utils/runAfterAnimationFrames'

const localSearchTextAtom = atom('')
const SEARCH_DEBOUNCE_MS = 400

function normalizeSearchText(text: string): string | undefined {
  return text.trim() || undefined
}

interface Props {
  readonly onSearchCancel?: () => void
  readonly onSearchStart?: () => void
  readonly postSearchActions?: () => void
}

function SearchOffers({
  onSearchCancel,
  onSearchStart,
  postSearchActions,
}: Props): React.JSX.Element {
  const {t} = useTranslation()

  const searchTextFromStorage = useAtomValue(searchTextAtom)
  const submitSearch = useSetAtom(submitSearchActionAtom)
  const setLocalSearchText = useSetAtom(localSearchTextAtom)
  const localSearchText = useAtomValue(localSearchTextAtom)
  const lastSubmittedSearchTextRef = useRef<string | undefined>(
    searchTextFromStorage ?? undefined
  )
  const localSearchTextRef = useRef(localSearchText)
  localSearchTextRef.current = localSearchText
  const isSynchronizingSearchTextRef = useRef(false)
  const isSearchPendingRef = useRef(false)
  const cancelPendingSubmitFrameRef = useRef<(() => void) | undefined>(
    undefined
  )
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPendingSubmit = useCallback(() => {
    cancelPendingSubmitFrameRef.current?.()
    cancelPendingSubmitFrameRef.current = undefined

    if (submitTimeoutRef.current !== null) {
      clearTimeout(submitTimeoutRef.current)
      submitTimeoutRef.current = null
    }
  }, [])

  const scheduleSubmit = useCallback(
    (searchText: string | undefined) => {
      isSearchPendingRef.current = false
      lastSubmittedSearchTextRef.current = searchText
      submitSearch(searchText)
      postSearchActions?.()
    },
    [postSearchActions, submitSearch]
  )

  const cancelPendingSearch = useCallback(() => {
    if (!isSearchPendingRef.current) return

    isSearchPendingRef.current = false
    onSearchCancel?.()
  }, [onSearchCancel])

  useEffect(() => {
    const nextSearchText = searchTextFromStorage ?? ''
    lastSubmittedSearchTextRef.current = normalizeSearchText(nextSearchText)

    if (localSearchTextRef.current === nextSearchText) return

    isSynchronizingSearchTextRef.current = true
    setLocalSearchText(nextSearchText)
  }, [searchTextFromStorage, setLocalSearchText])

  useEffect(() => {
    if (isSynchronizingSearchTextRef.current) {
      isSynchronizingSearchTextRef.current = false
      return
    }

    const nextSearchText = normalizeSearchText(localSearchText)

    clearPendingSubmit()
    cancelPendingSearch()

    if (lastSubmittedSearchTextRef.current === nextSearchText) {
      return
    }

    submitTimeoutRef.current = setTimeout(() => {
      submitTimeoutRef.current = null
      isSearchPendingRef.current = true
      onSearchStart?.()

      // Let the overlay paint before applying the search and re-rendering the
      // list. A new keystroke cancels both this frame and the visible loader.
      cancelPendingSubmitFrameRef.current = runAfterTwoAnimationFrames(() => {
        cancelPendingSubmitFrameRef.current = undefined
        scheduleSubmit(nextSearchText)
      })
    }, SEARCH_DEBOUNCE_MS)

    return clearPendingSubmit
  }, [
    cancelPendingSearch,
    clearPendingSubmit,
    localSearchText,
    onSearchStart,
    scheduleSubmit,
  ])

  useEffect(() => {
    return () => {
      cancelPendingSearch()
    }
  }, [cancelPendingSearch])

  return (
    <SearchBar
      valueAtom={localSearchTextAtom}
      placeholder={t('common.search')}
      flex={1}
    />
  )
}

export default SearchOffers
