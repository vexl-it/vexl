import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useMemo, useState} from 'react'
import {debounce} from 'tamagui'
import {
  searchTextAtom,
  submitSearchActionAtom,
} from '../../../../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Input from '../../../../Input'
import magnifyingGlass from '../../../../images/magnifyingGlass'

interface Props {
  postSearchActions?: () => void
}

function SearchOffers({postSearchActions}: Props): JSX.Element {
  const {t} = useTranslation()

  const searchTextFromStorage = useAtomValue(searchTextAtom)
  const submitSearch = useSetAtom(submitSearchActionAtom)

  const [searchText, setSearchText] = useState<string | undefined>(undefined)

  const setSearchTextWithDebounce = useMemo(
    () =>
      debounce((text: string) => {
        submitSearch(text)
        if (postSearchActions) postSearchActions()
      }, 400),
    [postSearchActions, submitSearch]
  )

  function onInputValueChange(value: string): void {
    setSearchText(value)
    setSearchTextWithDebounce(value.trim())
  }

  // it re-renders whole component one more time after debounce submitSearch
  // but maybe this is the most readable solution
  useEffect(() => {
    setSearchText(searchTextFromStorage)
  }, [searchTextFromStorage])

  return (
    <Input
      placeholder={t('filterOffers.searchOffers')}
      value={searchText}
      onChangeText={onInputValueChange}
      icon={magnifyingGlass}
      size="medium"
      variant="greyOnBlack"
      textColor="$greyOnBlack"
      style={{flex: 1}}
    />
  )
}

export default SearchOffers
