import magnifyingGlass from '../../images/magnifyingGlass'
import Button from '../../Button'
import TextInput from '../../Input'
import {useSearchText} from '../state/searchBar'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useSelectAll} from '../state/selectedContacts'
import {Stack, XStack} from 'tamagui'

function SearchBar(): JSX.Element {
  const [searchText, setSearchText] = useSearchText()
  const {t} = useTranslation()
  const [allSelected, toggleSelectAll] = useSelectAll()

  return (
    <XStack mt="$4">
      <Stack f={5} pr="$2">
        <TextInput
          placeholder={t('postLoginFlow.contactsList.inputPlaceholder')}
          value={searchText}
          onChangeText={setSearchText}
          icon={magnifyingGlass}
          small
        />
      </Stack>
      <Stack f={3}>
        <Button
          onPress={() => {
            toggleSelectAll(!allSelected)
          }}
          disabled={false}
          variant="black"
          small
          fullSize
          text={t(
            allSelected
              ? 'postLoginFlow.contactsList.deselectAll'
              : 'postLoginFlow.contactsList.selectAll'
          )}
        />
      </Stack>
    </XStack>
  )
}

export default SearchBar
