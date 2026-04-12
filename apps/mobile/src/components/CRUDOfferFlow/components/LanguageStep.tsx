import {
  type SpokenLanguage,
  spokenLanguagesOptions,
} from '@vexl-next/domain/src/general/offers'
import {Button, EditRow, FilterTag} from '@vexl-next/ui'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

interface LanguageStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
}

function LanguageStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
}: LanguageStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const {
    selectedSpokenLanguagesAtom,
    saveSelectedSpokenLanguagesActionAtom,
    toggleLanguageActionAtom,
  } = useMolecule(offerFormMolecule)

  const selectedLanguages = useAtomValue(selectedSpokenLanguagesAtom)
  const saveLanguages = useSetAtom(saveSelectedSpokenLanguagesActionAtom)
  const toggleLanguage = useSetAtom(toggleLanguageActionAtom)

  const languageNames = selectedLanguages
    .map((lang: SpokenLanguage) => t(`offerForm.spokenLanguages.${lang}`))
    .join(', ')

  if (!active) {
    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.chooseOfferLanguage')}
        headline={languageNames}
        onPress={onEdit}
      />
    )
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <YStack>
        <EditRow
          state="initial"
          headline={t('offerForm.chooseOfferLanguage')}
        />
        <YStack gap="$5" paddingVertical="$5">
          <XStack flexWrap="wrap" gap="$3">
            {spokenLanguagesOptions.map((language) => (
              <FilterTag
                key={language}
                label={t(`offerForm.spokenLanguages.${language}`)}
                selected={selectedLanguages.includes(language)}
                onPress={() => {
                  toggleLanguage(language)
                }}
              />
            ))}
          </XStack>
          <Button
            variant="primary"
            size="large"
            onPress={() => {
              saveLanguages()
              onComplete()
            }}
          >
            {ctaLabel ?? t('offerForm.next')}
          </Button>
        </YStack>
      </YStack>
    </Animated.View>
  )
}

export default LanguageStep
