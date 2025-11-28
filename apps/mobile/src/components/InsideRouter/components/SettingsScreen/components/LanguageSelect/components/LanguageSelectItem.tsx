import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {useAtom} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Text, XStack} from 'tamagui'
import {
  supportedTranslations,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
import RadioButton from '../../../../../../RadioButton'
import {createIsLanguageSelectedAtom} from '../../../atoms'

export const supportedLanguages = keys(supportedTranslations)
interface LanguageSelectItemProps {
  language: (typeof supportedLanguages)[number]
}

function LanguageSelectItem({
  language,
}: LanguageSelectItemProps): React.ReactElement {
  const {t} = useTranslation()
  const [isSelected, select] = useAtom(
    useMemo(() => createIsLanguageSelectedAtom(language), [language])
  )

  return (
    <TouchableOpacity
      onPress={() => {
        select(isSelected)
      }}
    >
      <XStack my="$3" gap="$2">
        <RadioButton
          active={isSelected}
          onPress={() => {
            select(isSelected)
          }}
        />
        <Text fos={18}>{supportedTranslations[language].flag}</Text>
        <Text
          col={isSelected ? '$black' : '$greyOnWhite'}
          fos={18}
          ff="$body500"
        >
          {t(`settings.items.language.${language}`)}
        </Text>
      </XStack>
    </TouchableOpacity>
  )
}

export default LanguageSelectItem
