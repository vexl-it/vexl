import magnifyingGlass from '../../images/magnifyingGlass'
import Button from '../../Button'
import TextInput from '../../Input'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {Stack, XStack} from 'tamagui'
import {useMolecule} from 'bunshi/dist/react'
import {contactSelectMolecule} from '../atom'
import {useAtom, useAtomValue} from 'jotai'

function SearchBar(): JSX.Element {
  const {t} = useTranslation()

  const {areThereAnyContactsToDisplayAtom, selectAllAtom, searchTextAtom} =
    useMolecule(contactSelectMolecule)
  const [searchText, setSearchText] = useAtom(searchTextAtom)
  const [allSelected, setAllSelected] = useAtom(selectAllAtom)
  const areThereAnyContactsToDisplay = useAtomValue(
    areThereAnyContactsToDisplayAtom
  )

  return (
    <Stack>
      <XStack mt="$4" mb="$2">
        <Stack f={5} pr="$2">
          <TextInput
            placeholder={t('postLoginFlow.contactsList.inputPlaceholder')}
            value={searchText}
            onChangeText={setSearchText}
            icon={magnifyingGlass}
            size="small"
          />
        </Stack>
        <Stack f={3}>
          <Button
            onPress={() => {
              setAllSelected((prev) => !prev)
            }}
            disabled={!areThereAnyContactsToDisplay}
            variant="black"
            size="small"
            adjustTextToFitOneLine
            fullSize
            text={t(
              allSelected && areThereAnyContactsToDisplay
                ? 'common.deselectAll'
                : 'common.selectAll'
            )}
          />
        </Stack>
      </XStack>
    </Stack>
  )
}

export default SearchBar
