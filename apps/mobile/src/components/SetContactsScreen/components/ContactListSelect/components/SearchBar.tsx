import {Button, SearchBar, Stack, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function ContactSearchBar(): React.ReactElement {
  const {t} = useTranslation()
  const {
    areThereAnyContactsToDisplayForSelectedTabAtom,
    selectAllAtom,
    searchTextAtom,
  } = useMolecule(contactSelectMolecule)
  const [allSelected, setAllSelected] = useAtom(selectAllAtom)
  const areThereAnyContactsToDisplayForSelectedTab = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )

  return (
    <Stack px="$4">
      <XStack mt="$4" mb="$2">
        <Stack flex={5} pr="$2">
          <SearchBar
            testID="@searchBar/contactInput"
            placeholder={t('postLoginFlow.contactsList.inputPlaceholder')}
            valueAtom={searchTextAtom}
          />
        </Stack>
        <Stack flex={3}>
          <Button
            onPress={() => {
              setAllSelected((prev) => !prev)
            }}
            disabled={!areThereAnyContactsToDisplayForSelectedTab}
            variant="tertiary"
            size="small"
            flex={1}
          >
            {t(
              allSelected && areThereAnyContactsToDisplayForSelectedTab
                ? 'common.deselectAll'
                : 'common.selectAll'
            )}
          </Button>
        </Stack>
      </XStack>
    </Stack>
  )
}

export default ContactSearchBar
