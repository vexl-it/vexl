import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {EditRow, RowButton} from '@vexl-next/ui'
import {BoxProduct, CurrencyBitcoinCircle, Tools} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

interface ListingTypeStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: (type: ListingType) => void
}

function ListingTypeStep({
  active,
  onEdit,
  onComplete,
}: ListingTypeStepProps): React.ReactElement {
  const {t} = useTranslation()
  const {listingTypeAtom, updateListingTypeActionAtom} =
    useMolecule(offerFormMolecule)
  const listingType = useAtomValue(listingTypeAtom)
  const updateListingType = useSetAtom(updateListingTypeActionAtom)

  const handlePress = useCallback(
    (type: ListingType) => {
      updateListingType(type)
      onComplete(type)
    },
    [updateListingType, onComplete]
  )

  const listingTypeLabel = (() => {
    if (listingType === 'PRODUCT') return t('offerForm.PRODUCTS')
    if (listingType === 'OTHER') return t('offerForm.SERVICES')
    return t('offerForm.BITCOIN')
  })()

  return (
    <>
      {active ? (
        <EditRow state="initial" headline={t('offerForm.whatAreYouHereFor')} />
      ) : (
        <EditRow
          state="completed"
          overline={t('offerForm.whatAreYouHereFor')}
          headline={listingTypeLabel}
          onPress={onEdit}
        />
      )}
      {active ? (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <YStack gap="$3" paddingVertical="$5">
            <RowButton
              label={t('offerForm.BITCOIN')}
              icon={CurrencyBitcoinCircle}
              value="BITCOIN"
              selected={listingType === 'BITCOIN'}
              onPress={handlePress}
            />
            <RowButton
              label={t('offerForm.PRODUCTS')}
              icon={BoxProduct}
              value="PRODUCT"
              selected={listingType === 'PRODUCT'}
              onPress={handlePress}
            />
            <RowButton
              label={t('offerForm.SERVICES')}
              icon={Tools}
              value="OTHER"
              selected={listingType === 'OTHER'}
              onPress={handlePress}
            />
          </YStack>
        </Animated.View>
      ) : null}
    </>
  )
}

export default ListingTypeStep
