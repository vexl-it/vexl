import {useFocusEffect} from '@react-navigation/native'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, Text} from 'tamagui'
import {
  supportedTranslations,
  useTranslation,
} from '../../../../../../utils/localization/I18nProvider'
import {currentAppLanguageAtom} from '../../../../../../utils/preferences'
import {selectedLanguageAtom} from '../../atoms'
import LanguageSelectItem from './components/LanguageSelectItem'

const languages = keys(supportedTranslations)

function LanguageSelect(): React.ReactElement {
  const {t} = useTranslation()
  const currentAppLanguage = useAtomValue(currentAppLanguageAtom)
  const setSelectedAppLanguage = useSetAtom(selectedLanguageAtom)

  useFocusEffect(
    useCallback(() => {
      setSelectedAppLanguage(currentAppLanguage ?? 'en')
    }, [currentAppLanguage, setSelectedAppLanguage])
  )

  return (
    <Stack>
      <Text
        col="$black"
        my="$4"
        ff="$heading"
        fos={24}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {t('settings.items.changeLanguage')}
      </Text>
      {languages.map((language) => (
        <LanguageSelectItem key={language} language={language} />
      ))}
    </Stack>
  )
}

export default LanguageSelect
