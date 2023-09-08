import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useState} from 'react'
import {useAtomValue, useSetAtom} from 'jotai'
import {Stack, Text, XStack} from 'tamagui'
import DropdownSelectButton from '../../../DropdownSelectButton'
import OfferFormSpokenLanguageCell from './OfferFormSpokenLanguageCell'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import SpokenLanguageSelect from './SpokenLanguageSelect'
import {
  resetSpokenLanguagesToInitialStateActionAtom,
  saveSelectedSpokenLanguagesActionAtom,
  spokenLanguagesAtomsAtom,
} from '../../atom'

function SpokenLanguagesComponent(): JSX.Element {
  const {t} = useTranslation()
  const resetSpokenLanguagesToInitialState = useSetAtom(
    resetSpokenLanguagesToInitialStateActionAtom
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
            />
          </Stack>
        ))}
      </XStack>
      <SpokenLanguageSelect
        onClose={() => {
          setSpokenLanguageSelectVisible(false)
          resetSpokenLanguagesToInitialState()
        }}
        onSubmit={() => {
          saveSelectedSpokenLanguages()
        }}
        visible={spokenLanguageSelectVisible}
      />
    </Stack>
  )
}

export default SpokenLanguagesComponent
