import {SearchBar} from '@vexl-next/ui'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {debounce} from 'tamagui'
import {
  searchTextAtom,
  submitSearchActionAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

const localSearchTextAtom = atom('')

interface Props {
  postSearchActions?: () => void
}

function SearchOffers({postSearchActions}: Props): React.JSX.Element {
  const {t} = useTranslation()

  const searchTextFromStorage = useAtomValue(searchTextAtom)
  const submitSearch = useSetAtom(submitSearchActionAtom)
  const setLocalSearchText = useSetAtom(localSearchTextAtom)
  const localSearchText = useAtomValue(localSearchTextAtom)

  useEffect(() => {
    setLocalSearchText(searchTextFromStorage ?? '')
  }, [searchTextFromStorage, setLocalSearchText])

  const debouncedSubmit = useMemo(
    () =>
      debounce((text: string) => {
        submitSearch(text || undefined)
        postSearchActions?.()
      }, 400),
    [postSearchActions, submitSearch]
  )

  useEffect(() => {
    debouncedSubmit(localSearchText.trim())
  }, [localSearchText, debouncedSubmit])

  return (
    <SearchBar
      valueAtom={localSearchTextAtom}
      placeholder={t('common.search')}
      flex={1}
    />
  )
}

export default SearchOffers
