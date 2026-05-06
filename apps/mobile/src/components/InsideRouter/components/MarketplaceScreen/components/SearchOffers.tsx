import {SearchBar} from '@vexl-next/ui'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef} from 'react'
import {
  searchTextAtom,
  submitSearchActionAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

const localSearchTextAtom = atom('')
const SEARCH_DEBOUNCE_MS = 400

function normalizeSearchText(text: string): string | undefined {
  return text.trim() || undefined
}

interface Props {
  onSearchStart?: () => void
  postSearchActions?: () => void
}

function SearchOffers({
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
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPendingSubmit = useCallback(() => {
    if (submitTimeoutRef.current !== null) {
      clearTimeout(submitTimeoutRef.current)
      submitTimeoutRef.current = null
    }
  }, [])

  const scheduleSubmit = useCallback(
    (searchText: string | undefined) => {
      onSearchStart?.()
      lastSubmittedSearchTextRef.current = searchText
      submitSearch(searchText)
      postSearchActions?.()
    },
    [onSearchStart, postSearchActions, submitSearch]
  )

  useEffect(() => {
    lastSubmittedSearchTextRef.current = searchTextFromStorage ?? undefined
    setLocalSearchText(searchTextFromStorage ?? '')
  }, [searchTextFromStorage, setLocalSearchText])

  useEffect(() => {
    const nextSearchText = normalizeSearchText(localSearchText)

    if (lastSubmittedSearchTextRef.current === nextSearchText) return

    clearPendingSubmit()

    if (nextSearchText === undefined) {
      scheduleSubmit(undefined)
    } else {
      submitTimeoutRef.current = setTimeout(() => {
        submitTimeoutRef.current = null
        scheduleSubmit(nextSearchText)
      }, SEARCH_DEBOUNCE_MS)
    }

    return clearPendingSubmit
  }, [clearPendingSubmit, localSearchText, scheduleSubmit])

  return (
    <SearchBar
      valueAtom={localSearchTextAtom}
      placeholder={t('common.search')}
      flex={1}
    />
  )
}

export default SearchOffers
