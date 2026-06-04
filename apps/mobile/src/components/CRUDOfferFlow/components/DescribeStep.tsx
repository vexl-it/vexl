import {Button, EditRow, Typography} from '@vexl-next/ui'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {TextArea, YStack} from 'tamagui'
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
}

function DescribeStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
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
        <EditRow state="initial" headline={t('offerForm.describeYourOffer')} />
        <YStack gap="$5" paddingVertical="$5">
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$3"
            padding="$5"
            gap="$3"
          >
            <TextArea
              unstyled
              verticalAlign="top"
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={offerDescription}
              onChangeText={setOfferDescription}
              placeholder={t('offerForm.description.writeWhyPeopleShouldTake')}
              placeholderTextColor="$foregroundTertiary"
              selectionColor="$accentYellowPrimary"
              fontFamily="$body"
              fontWeight="500"
              fontSize="$5"
              lineHeight={24}
              color="$foregroundPrimary"
              paddingHorizontal={0}
              paddingVertical={0}
              minHeight={72}
            />
            <YStack alignItems="flex-end">
              <Typography variant="micro" color="$foregroundSecondary">
                {offerDescription.length}/{MAX_DESCRIPTION_LENGTH}
              </Typography>
            </YStack>
          </YStack>

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
