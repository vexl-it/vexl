import TextInput from '../../Input'
import magnifyingGlass from '../../images/magnifyingGlass'
import {useAtom} from 'jotai'
import {searchTextAtom} from '../atom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useEffect} from 'react'

function SearchBar(): JSX.Element {
  const {t} = useTranslation()
  const [searchText, setSearchText] = useAtom(searchTextAtom)

  useEffect(() => {
    return () => {
      setSearchText('')
    }
  }, [setSearchText])

  return (
    <TextInput
      placeholder={t('common.search')}
      value={searchText}
      onChangeText={setSearchText}
      icon={magnifyingGlass}
      size={'small'}
      variant={'greyOnWhite'}
    />
  )
}

export default SearchBar
