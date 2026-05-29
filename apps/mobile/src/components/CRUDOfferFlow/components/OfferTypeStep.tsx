import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {EditRow, RowButton} from '@vexl-next/ui'
import {ArrowLeft, ArrowRight} from '@vexl-next/ui/src/icons'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {Array, pipe} from 'effect'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {YStack} from 'tamagui'
import {
  useTranslation,
  type TFunction,
} from '../../../utils/localization/I18nProvider'
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
  const {listingTypeAtom, offerTypeAtom} = useMolecule(offerFormMolecule)
  const listingType = useAtomValue(listingTypeAtom)
  const [offerType, setOfferType] = useAtom(offerTypeAtom)

  const offerTypeLabel = getOfferTypeLabel({
    listingType,
    offerType,
    t,
  })

  const handlePress = useCallback(
    (type: OfferType) => {
      setOfferType(type)
      onComplete()
    },
    [setOfferType, onComplete]
  )

  const offerTypeOptions = getOfferTypeOptions(listingType)

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
            {pipe(
              offerTypeOptions,
              Array.map(({icon, type}) => (
                <RowButton
                  key={type}
                  label={getOfferTypeLabel({
                    listingType,
                    offerType: type,
                    t,
                  })}
                  icon={icon}
                  value={type}
                  selected={offerType === type}
                  onPress={handlePress}
                />
              ))
            )}
          </YStack>
        </Animated.View>
      ) : null}
    </>
  )
}

interface OfferTypeOption {
  readonly type: OfferType
  readonly icon: React.ComponentType<IconProps>
}

function getOfferTypeOptions(
  listingType: ListingType | undefined
): readonly OfferTypeOption[] {
  const buyOption = {type: 'BUY', icon: ArrowLeft} satisfies OfferTypeOption
  const sellOption = {type: 'SELL', icon: ArrowRight} satisfies OfferTypeOption

  return listingType === 'PRODUCT'
    ? [sellOption, buyOption]
    : [buyOption, sellOption]
}

function getOfferTypeLabel({
  listingType,
  offerType,
  t,
}: {
  readonly listingType: ListingType | undefined
  readonly offerType: OfferType | undefined
  readonly t: TFunction
}): string {
  if (listingType === 'PRODUCT') {
    return offerType === 'SELL'
      ? t('offerForm.sellProduct')
      : t('offerForm.seekProduct')
  }

  if (listingType === 'OTHER') {
    return offerType === 'SELL'
      ? t('offerForm.provideService')
      : t('offerForm.hireService')
  }

  return offerType === 'SELL'
    ? t('offerForm.wantToSellBitcoin')
    : t('offerForm.wantToBuyBitcoin')
}

export default OfferTypeStep
