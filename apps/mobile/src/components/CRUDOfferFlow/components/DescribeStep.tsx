import {Button, EditRow, LabeledTextArea, YStack} from '@vexl-next/ui'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

const MAX_DESCRIPTION_LENGTH = 500

interface DescribeStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
  readonly showInitialIcon?: boolean
}

function DescribeStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
  showInitialIcon,
}: DescribeStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const {offerDescriptionAtom} = useMolecule(offerFormMolecule)
  const [offerDescription, setOfferDescription] = useAtom(offerDescriptionAtom)

  const hasDescription = offerDescription.trim().length > 0

  if (!active) {
    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.describeYourOffer')}
        headline={offerDescription}
        onPress={onEdit}
      />
    )
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <YStack>
        <EditRow
          state="initial"
          headline={t('offerForm.describeYourOffer')}
          showInitialIcon={showInitialIcon}
        />
        <YStack gap="$5" paddingVertical="$5">
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
        </YStack>
      </YStack>
    </Animated.View>
  )
}

export default DescribeStep
