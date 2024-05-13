import {useSetAtom} from 'jotai'
import {useMemo, useState} from 'react'
import {debounce} from 'tamagui'
import {submitSearchActionAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Input from '../../../../Input'
import magnifyingGlass from '../../../../images/magnifyingGlass'

interface Props {
  postSearchActions?: () => void
}

function SearchOffers({postSearchActions}: Props): JSX.Element {
  const {t} = useTranslation()
  const [searchText, setSearchText] = useState('')

  const submitSearch = useSetAtom(submitSearchActionAtom)

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
