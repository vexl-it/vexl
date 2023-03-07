import styled from '@emotion/native'
import magnifyingGlass from '../image/magnifyingGlass'
import Button from '../../Button'
import TextInput from '../../Input'
import {useSearchText} from '../state/searchBar'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useSelectAll} from '../state/selectedContacts'

const RootContainer = styled.View`
  flex-direction: row;
  margin-top: 16px;
`
const SelectAllButton = styled(Button)`
  height: auto;
`

const InputContainer = styled.View`
  flex: 1;
`

const InputStyled = styled(TextInput)`
  margin-left: 0;
  margin-right: 16px;
`

function SearchBar(): JSX.Element {
  const [searchText, setSearchText] = useSearchText()
  const {t} = useTranslation()
  const [allSelected, toggleSelectAll] = useSelectAll()

  return (
    <RootContainer>
      <InputContainer>
        <InputStyled
          placeholder={t('postLoginFlow.contactsList.inputPlaceholder')}
          value={searchText}
          onChangeText={setSearchText}
          icon={magnifyingGlass}
          size="small"
        />
      </InputContainer>
      <SelectAllButton
        onPress={() => {
          toggleSelectAll(!allSelected)
        }}
        disabled={false}
        variant="black"
        size="small"
        text={t(
          allSelected
            ? 'postLoginFlow.contactsList.deselectAll'
            : 'postLoginFlow.contactsList.selectAll'
        )}
      />
    </RootContainer>
  )
}

export default SearchBar
