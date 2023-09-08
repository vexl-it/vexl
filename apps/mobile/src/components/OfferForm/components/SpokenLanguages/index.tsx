import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useState} from 'react'
import {
  type Atom,
  type PrimitiveAtom,
  type SetStateAction,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import {type SpokenLanguage} from '@vexl-next/domain/dist/general/offers'
import {Stack, Text, XStack} from 'tamagui'
import DropdownSelectButton from '../../../DropdownSelectButton'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import SpokenLanguageSelect from './SpokenLanguageSelect'
import OfferFormSpokenLanguageCell from './OfferFormSpokenLanguageCell'

interface Props {
  createIsThisLanguageSelectedAtom: (
    spokenLanguageAtom: SpokenLanguage
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
  spokenLanguagesAtomsAtom: Atom<Array<Atom<SpokenLanguage>>>
  removeSpokenLanguageActionAtom: WritableAtom<
    null,
    [spokenLanguage: SpokenLanguage],
    void
  >
  resetSelectedSpokenLanguagesActionAtom: PrimitiveAtom<void>
  saveSelectedSpokenLanguagesActionAtom: PrimitiveAtom<void>
}

function SpokenLanguagesComponent({
  createIsThisLanguageSelectedAtom,
  spokenLanguagesAtomsAtom,
  removeSpokenLanguageActionAtom,
  resetSelectedSpokenLanguagesActionAtom,
  saveSelectedSpokenLanguagesActionAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const resetSelectedSpokenLanguages = useSetAtom(
    resetSelectedSpokenLanguagesActionAtom
  )
  const saveSelectedSpokenLanguages = useSetAtom(
    saveSelectedSpokenLanguagesActionAtom
  )
  const spokenLanguagesAtoms = useAtomValue(spokenLanguagesAtomsAtom)
  const [spokenLanguageSelectVisible, setSpokenLanguageSelectVisible] =
    useState<boolean>(false)

  return (
    <Stack>
      <DropdownSelectButton
        onPress={() => {
          setSpokenLanguageSelectVisible(true)
        }}
      >
        <Text fos={18} ff={'$body600'} col={'$greyOnBlack'}>
          {t('offerForm.spokenLanguages.indicatePreferredLanguage')}
        </Text>
      </DropdownSelectButton>
      <XStack ai={'center'} mt={'$4'} flexWrap={'wrap'} space={'$2'}>
        {spokenLanguagesAtoms.map((spokenLanguageAtom) => (
          <Stack key={atomKeyExtractor(spokenLanguageAtom)} mt={'$2'}>
            <OfferFormSpokenLanguageCell
              spokenLanguageAtom={spokenLanguageAtom}
              removeSpokenLanguageActionAtom={removeSpokenLanguageActionAtom}
            />
          </Stack>
        ))}
      </XStack>
      <SpokenLanguageSelect
        createIsThisLanguageSelectedAtom={createIsThisLanguageSelectedAtom}
        onClose={() => {
          setSpokenLanguageSelectVisible(false)
          resetSelectedSpokenLanguages()
        }}
        onSubmit={() => {
          saveSelectedSpokenLanguages()
        }}
        resetSelectedSpokenLanguagesActionAtom={
          resetSelectedSpokenLanguagesActionAtom
        }
        visible={spokenLanguageSelectVisible}
      />
    </Stack>
  )
}

export default SpokenLanguagesComponent
