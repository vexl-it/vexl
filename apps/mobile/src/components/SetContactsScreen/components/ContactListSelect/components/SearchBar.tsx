import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Stack, XStack, debounce} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import TextInput from '../../../../Input'
import magnifyingGlass from '../../../../images/magnifyingGlass'
import {contactSelectMolecule} from '../atom'

function SearchBar(): React.ReactElement {
  const {t} = useTranslation()
  const {
    areThereAnyContactsToDisplayForSelectedTabAtom,
    selectAllAtom,
    searchTextAtom,
  } = useMolecule(contactSelectMolecule)
  const [searchText, setSearchText] = useAtom(searchTextAtom)
  const [inputValue, setInputValue] = useState(() => searchText)

  const [allSelected, setAllSelected] = useAtom(selectAllAtom)
  const areThereAnyContactsToDisplayForSelectedTab = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )

  const setSearchTextDebounce = useMemo(
    () =>
      debounce((t: string) => {
        setSearchText(t)
      }, 500),
    [setSearchText]
  )

  const onInputValueChange = useCallback(
    (value: string) => {
      setInputValue(value)
      setSearchTextDebounce(value)
    },
    [setInputValue, setSearchTextDebounce]
  )

  useEffect(() => {
    if (searchText === '') setInputValue('')
  }, [setInputValue, searchText])

  return (
    <Stack px="$4">
      <XStack mt="$4" mb="$2">
        <Stack f={5} pr="$2">
          <TextInput
            testID="@searchBar/contactInput"
            placeholder={t('postLoginFlow.contactsList.inputPlaceholder')}
            value={inputValue}
            onChangeText={onInputValueChange}
            icon={magnifyingGlass}
            size="small"
          />
        </Stack>
        <Stack f={3}>
          <Button
            onPress={() => {
              setAllSelected((prev) => !prev)
            }}
            disabled={!areThereAnyContactsToDisplayForSelectedTab}
            variant="black"
            size="small"
            adjustTextToFitOneLine
            fullSize
            text={t(
              allSelected && areThereAnyContactsToDisplayForSelectedTab
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
