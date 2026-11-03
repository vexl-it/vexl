import {
  type SpokenLanguage,
  spokenLanguagesOptions,
} from '@vexl-next/domain/src/general/offers'
import {Button, EditStep, FilterTag, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'

function LanguageStep({
  onComplete,
  ctaLabel,
  ...stepProps
}: OfferFormStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const {spokenLanguagesAtom, toggleLanguageActionAtom} =
    useMolecule(offerFormMolecule)

  const selectedLanguages = useAtomValue(spokenLanguagesAtom)
  const toggleLanguage = useSetAtom(toggleLanguageActionAtom)

  const languageNames = selectedLanguages
    .map((lang: SpokenLanguage) => t(`offerForm.spokenLanguages.${lang}`))
    .join(', ')

  return (
    <EditStep
      {...stepProps}
      title={t('offerForm.chooseOfferLanguage')}
      value={languageNames}
    >
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
      <Button variant="primary" size="large" onPress={onComplete}>
        {ctaLabel ?? t('offerForm.next')}
      </Button>
    </EditStep>
  )
}

export default LanguageStep
