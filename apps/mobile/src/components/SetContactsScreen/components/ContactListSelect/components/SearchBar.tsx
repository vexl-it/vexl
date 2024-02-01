import {useMolecule} from 'bunshi/dist/react'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Keyboard} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import Button from '../../../../Button'
import TextInput from '../../../../Input'
import magnifyingGlass from '../../../../images/magnifyingGlass'
import {contactSelectMolecule} from '../atom'

function NiceJobHuntingSats(): JSX.Element {
  return (
    <Stack gap="$2">
      <Text fontFamily="$heading" fontSize={32} color="$black">
        Nice job hunting sats!
      </Text>
      <Text color="$black">
        Your word is{' '}
        <Text color="$black" fontWeight="800">
          empower
        </Text>
        💪.
      </Text>
      <Text color="$black">Good luck finding the rest! 🚀</Text>
    </Stack>
  )
}

function SearchBar(): JSX.Element {
  const {t} = useTranslation()

  const {areThereAnyContactsToDisplayAtom, selectAllAtom, searchTextAtom} =
    useMolecule(contactSelectMolecule)
  const [searchText, setSearchText] = useAtom(searchTextAtom)
  const [allSelected, setAllSelected] = useAtom(selectAllAtom)
  const areThereAnyContactsToDisplay = useAtomValue(
    areThereAnyContactsToDisplayAtom
  )
  const showModal = useSetAtom(askAreYouSureActionAtom)

  useEffect(() => {
    if (searchText.trim() === '3367666933777') {
      Keyboard.dismiss()
      void pipe(
        showModal({
          variant: 'info',
          steps: [
            {
              MainSectionComponent: NiceJobHuntingSats,
              positiveButtonText: 'Nice!',
              type: 'StepWithChildren',
            },
          ],
        }),
        TE.map(() => {
          setSearchText('')
        })
      )()
    }
  }, [searchText, setSearchText, showModal])

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
