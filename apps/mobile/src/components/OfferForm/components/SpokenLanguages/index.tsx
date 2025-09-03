import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import React, {useState} from 'react'
import {Stack, Text, XStack} from 'tamagui'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import DropdownSelectButton from '../../../DropdownSelectButton'
import OfferFormSpokenLanguageCell from './OfferFormSpokenLanguageCell'
import SpokenLanguageSelect from './SpokenLanguageSelect'

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
}: Props): React.ReactElement {
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
        <Text fos={18} ff="$body500" col="$greyOnBlack">
          {t('offerForm.spokenLanguages.indicatePreferredLanguage')}
        </Text>
      </DropdownSelectButton>
      <XStack ai="center" mt="$4" flexWrap="wrap" gap="$2">
        {spokenLanguagesAtoms.map((spokenLanguageAtom) => (
          <Stack key={atomKeyExtractor(spokenLanguageAtom)} mt="$2">
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
