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
          <YStack>
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
            {/* TODO: uncomment when board functionality is implemented and ready
            <YStack gap="$3" paddingTop="$3">
              <XStack alignItems="center" gap="$3" paddingVertical="$3">
                <Stack
                  flex={1}
                  height="$0.5"
                  backgroundColor="$foregroundSecondary"
                />
                <Typography variant="micro" color="$foregroundSecondary">
                  {t('offerForm.somethingElseOnYourMind')}
                </Typography>
                <Stack
                  flex={1}
                  height="$0.5"
                  backgroundColor="$foregroundSecondary"
                />
              </XStack>
              <XStack
                alignItems="center"
                justifyContent="center"
                gap="$3"
                onPress={() => {
                  handlePress('OTHER')
                }}
              >
                <PinBoard
                  color={theme.accentHighlightSecondary.get()}
                  size={getTokens().size.$7.val}
                />
                <Typography
                  variant="paragraphSmallBold"
                  color="$accentHighlightSecondary"
                >
                  {t('offerForm.postItOnTheBoard')}
                </Typography>
              </XStack>
            </YStack>
            */}
          </YStack>
        </Animated.View>
      ) : null}
    </>
  )
}

export default ListingTypeStep
