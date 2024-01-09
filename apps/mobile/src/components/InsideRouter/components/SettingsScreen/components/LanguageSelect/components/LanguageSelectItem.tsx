import {useAtom} from 'jotai'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Text, XStack} from 'tamagui'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {
  supportedTranslations,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
import {createIsLanguageSelectedAtom} from '../../../atoms'
import RadioButton from '../../../../../../RadioButton'

const languages = keys(supportedTranslations)
interface LanguageSelectItemProps {
  language: (typeof languages)[number]
}

function LanguageSelectItem({language}: LanguageSelectItemProps): JSX.Element {
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
      <XStack my={'$3'} space={'$2'}>
        <RadioButton
          active={isSelected}
          onPress={() => {
            select(isSelected)
          }}
        />
        <Text
          col={isSelected ? '$black' : '$greyOnWhite'}
          fos={18}
          ff={'$body500'}
        >
          {t(`settings.items.language.${language}`)}
        </Text>
      </XStack>
    </TouchableOpacity>
  )
}

export default LanguageSelectItem
