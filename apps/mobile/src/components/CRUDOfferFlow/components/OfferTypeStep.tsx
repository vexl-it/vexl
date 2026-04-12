import {EditRow, RowButton} from '@vexl-next/ui'
import {ArrowLeft, ArrowRight} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React, {useCallback} from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

interface OfferTypeStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
}

function OfferTypeStep({
  active,
  onEdit,
  onComplete,
}: OfferTypeStepProps): React.ReactElement {
  const {t} = useTranslation()
  const {offerTypeAtom} = useMolecule(offerFormMolecule)
  const [offerType, setOfferType] = useAtom(offerTypeAtom)

  const offerTypeLabel =
    offerType === 'SELL' ? t('offerForm.offer') : t('offerForm.want')

  const handlePress = useCallback(
    (type: 'BUY' | 'SELL') => {
      setOfferType(type)
      onComplete()
    },
    [setOfferType, onComplete]
  )

  return (
    <>
      {active ? (
        <EditRow state="initial" headline={t('offerForm.whatDoYouWantToDo')} />
      ) : (
        <EditRow
          state="completed"
          overline={t('offerForm.whatDoYouWantToDo')}
          headline={offerTypeLabel}
          onPress={onEdit}
        />
      )}
      {active ? (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <YStack gap="$3">
            <RowButton
              label={t('offerForm.offer')}
              icon={ArrowRight}
              value="SELL"
              selected={offerType === 'SELL'}
              onPress={handlePress}
            />
            <RowButton
              label={t('offerForm.want')}
              icon={ArrowLeft}
              value="BUY"
              selected={offerType === 'BUY'}
              onPress={handlePress}
            />
          </YStack>
        </Animated.View>
      ) : null}
    </>
  )
}

export default OfferTypeStep
