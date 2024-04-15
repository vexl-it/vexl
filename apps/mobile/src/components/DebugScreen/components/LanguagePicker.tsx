import {Picker} from '@react-native-picker/picker'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {useSetAtom} from 'jotai'
import {useState} from 'react'
import {Text, YStack} from 'tamagui'
import * as translations from '../../../utils/localization/translations'
import {currentAppLanguageAtom} from '../../../utils/preferences'
import Button from '../../Button'

const languages = keys(translations)

function LanguagePicker(): JSX.Element {
  const [selectedLanguage, setSelectedLanguage] =
    useState<(typeof languages)[number]>('en')

  const setCurrentAppLanguage = useSetAtom(currentAppLanguageAtom)

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
          setCurrentAppLanguage(selectedLanguage)
        }}
        variant="primary"
        size="small"
        text="Set language"
      />
    </YStack>
  )
}

export default LanguagePicker
