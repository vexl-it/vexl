import {Stack, Text} from 'tamagui'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {
  supportedTranslations,
  useTranslation,
} from '../../../../../../utils/localization/I18nProvider'
import LanguageSelectItem from './components/LanguageSelectItem'
import {useAtomValue, useSetAtom} from 'jotai'
import {selectedLanguageAtom} from '../../atoms'
import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {currentAppLanguageAtom} from '../../../../../../utils/preferences'

const languages = keys(supportedTranslations)

function LanguageSelect(): JSX.Element {
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
        my={'$4'}
        ff={'$heading'}
        fos={28}
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
