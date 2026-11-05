import {Button, EditStep, LabeledTextArea} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'

const MAX_DESCRIPTION_LENGTH = 500

function DescribeStep({
  onComplete,
  ctaLabel,
  ...stepProps
}: OfferFormStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const {offerDescriptionAtom} = useMolecule(offerFormMolecule)
  const [offerDescription, setOfferDescription] = useAtom(offerDescriptionAtom)

  const hasDescription = offerDescription.trim().length > 0

  return (
    <EditStep
      {...stepProps}
      title={t('offerForm.describeYourOffer')}
      value={offerDescription}
    >
      <LabeledTextArea
        maxLength={MAX_DESCRIPTION_LENGTH}
        value={offerDescription}
        onChangeText={setOfferDescription}
        placeholder={t('offerForm.description.writeWhyPeopleShouldTake')}
        minHeight={72}
      />
      {hasDescription ? (
        <Button variant="primary" size="large" onPress={onComplete}>
          {ctaLabel ?? t('offerForm.next')}
        </Button>
      ) : null}
    </EditStep>
  )
}

export default DescribeStep
