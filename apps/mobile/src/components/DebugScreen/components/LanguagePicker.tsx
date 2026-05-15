import * as allTranslations from '@vexl-next/localization/src/translations'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {Button, Picker, Typography, YStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {currentAppLanguageAtom} from '../../../utils/preferences'

const translations = keys(allTranslations)

function LanguagePicker(): React.ReactElement {
  const [selectedLanguage, setSelectedLanguage] =
    useState<(typeof translations)[number]>('en')

  const setCurrentAppLanguage = useSetAtom(currentAppLanguageAtom)

  return (
    <YStack gap="$2">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        Change language
      </Typography>
      <Picker
        value={selectedLanguage}
        onValueChange={setSelectedLanguage}
        items={translations.map((translation) => ({
          label: translation,
          value: translation,
        }))}
      />
      <Button
        onPress={() => {
          setCurrentAppLanguage(selectedLanguage)
        }}
        variant="primary"
        size="small"
      >
        Set language
      </Button>
    </YStack>
  )
}

export default LanguagePicker
