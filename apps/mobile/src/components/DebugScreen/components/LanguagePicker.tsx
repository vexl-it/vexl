import {Picker} from '@react-native-picker/picker'
import * as allTranslations from '@vexl-next/localization/src/translations'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {Text, YStack} from 'tamagui'
import {currentAppLanguageAtom} from '../../../utils/preferences'
import Button from '../../Button'

const translations = keys(allTranslations)

function LanguagePicker(): React.ReactElement {
  const [selectedLanguage, setSelectedLanguage] =
    useState<(typeof translations)[number]>('en')

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
        {translations.map((translation) => (
          <Picker.Item
            key={translation}
            label={translation}
            value={translation}
          />
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
