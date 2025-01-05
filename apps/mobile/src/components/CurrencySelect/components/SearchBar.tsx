import {useAtom} from 'jotai'
import {useEffect} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import TextInput, {type Props} from '../../Input'
import magnifyingGlass from '../../images/magnifyingGlass'
import {searchTextAtom} from '../atom'

function SearchBar(props: Props): JSX.Element {
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
      size="small"
      variant="greyOnWhite"
      {...props}
    />
  )
}

export default SearchBar
