import {
  type SpokenLanguage,
  spokenLanguagesOptions,
} from '@vexl-next/domain/src/general/offers'
import {
  Button,
  FilterTag,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {lastUsedOfferSpokenLanguagesAtom} from '../../../utils/preferences'
import useSafeGoBack from '../../../utils/useSafeGoBack'

function EditProfileSpokenLanguagesScreen(): React.ReactElement {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()
  const savedLanguages = useAtomValue(lastUsedOfferSpokenLanguagesAtom)
  const setSavedLanguages = useSetAtom(lastUsedOfferSpokenLanguagesAtom)
  const [selectedLanguages, setSelectedLanguages] = useState<SpokenLanguage[]>([
    ...savedLanguages,
  ])

  useEffect(() => {
    setSelectedLanguages([...savedLanguages])
  }, [savedLanguages])

  const toggleLanguage = useCallback((language: SpokenLanguage) => {
    setSelectedLanguages((previousLanguages) => {
      const isSelected = pipe(previousLanguages, Array.contains(language))

      if (isSelected) {
        if (previousLanguages.length <= 1) return previousLanguages

        return pipe(
          previousLanguages,
          Array.filter((selectedLanguage) => selectedLanguage !== language)
        )
      }

      return [...previousLanguages, language]
    })
  }, [])

  const saveLanguages = useCallback(() => {
    setSavedLanguages([...selectedLanguages])
    goBack()
  }, [goBack, selectedLanguages, setSavedLanguages])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editProfileScreen.spokenLanguagesSelect.title')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: goBack,
            },
          ]}
        />
      }
      footer={
        <Button variant="primary" size="large" onPress={saveLanguages}>
          {t('common.save')}
        </Button>
      }
    >
      <YStack gap="$5" paddingTop="$4">
        <Typography variant="description" color="$foregroundSecondary">
          {t('editProfileScreen.spokenLanguagesSelect.description')}
        </Typography>
        <XStack flexWrap="wrap" gap="$3">
          {pipe(
            spokenLanguagesOptions,
            Array.map((language) => (
              <FilterTag
                key={language}
                label={t(`offerForm.spokenLanguages.${language}`)}
                selected={pipe(selectedLanguages, Array.contains(language))}
                onPress={() => {
                  toggleLanguage(language)
                }}
              />
            ))
          )}
        </XStack>
      </YStack>
    </Screen>
  )
}

export default EditProfileSpokenLanguagesScreen
