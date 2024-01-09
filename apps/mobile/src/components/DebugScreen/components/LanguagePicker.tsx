import {Picker} from '@react-native-picker/picker'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {I18n} from 'i18n-js'
import {useSetAtom} from 'jotai'
import {useState} from 'react'
import {Text, YStack} from 'tamagui'
import {i18nAtom} from '../../../utils/localization/I18nProvider'
import * as translations from '../../../utils/localization/translations'
import Button from '../../Button'

const languages = keys(translations)

function LanguagePicker(): JSX.Element {
  const [selectedLanguage, setSelectedLanguage] =
    useState<(typeof languages)[number]>('en')

  const setI18nAtom = useSetAtom(i18nAtom)

  return (
    <YStack>
      <Text color="$black" fos={25}>
        Change language
      </Text>
      <Picker
        selectedValue={selectedLanguage}
        onValueChange={setSelectedLanguage}
      >
        {languages.map((language) => (
          <Picker.Item key={language} label={language} value={language} />
        ))}
      </Picker>
      <Button
        onPress={() => {
          const newI18n = new I18n(translations)
          newI18n.locale = selectedLanguage
          newI18n.defaultLocale = 'en'
          newI18n.enableFallback = true
          setI18nAtom(newI18n)
        }}
        variant={'primary'}
        size="small"
        text={'Set language'}
      />
    </YStack>
  )
}

export default LanguagePicker
