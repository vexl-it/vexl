import {
  productCategoryOptions,
  type ProductCategory,
} from '@vexl-next/domain/src/general/offers'
import {Button, EditRow, FilterTag} from '@vexl-next/ui'
import {
  BoltElectric,
  BoxProduct,
  CherriesFoodFruit,
  GoldBricks,
  More,
} from '@vexl-next/ui/src/icons'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

const productCategoryIcons: Record<
  ProductCategory,
  React.ComponentType<IconProps>
> = {
  PRECIOUS_METALS: GoldBricks,
  PRODUCE: CherriesFoodFruit,
  ELECTRONICS: BoltElectric,
  ASSETS: BoxProduct,
  OTHERS: More,
}

interface ProductCategoryStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
  readonly showInitialIcon?: boolean
}

function ProductCategoryStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
  showInitialIcon,
}: ProductCategoryStepProps): React.ReactElement {
  const {t} = useTranslation()
  const {productCategoriesAtom, selectProductCategoryActionAtom} =
    useMolecule(offerFormMolecule)
  const productCategories = useAtomValue(productCategoriesAtom)
  const selectProductCategory = useSetAtom(selectProductCategoryActionAtom)

  const selectedCategoryOption = pipe(
    Option.fromNullable(productCategories),
    Option.flatMap(Array.head)
  )
  const hasSelection = Option.isSome(selectedCategoryOption)
  const headline = pipe(
    selectedCategoryOption,
    Option.match({
      onNone: () => t('offerForm.selectTypeOfProduct'),
      onSome: (category) => t(`filterOffers.productCategory.${category}`),
    })
  )

  if (!active) {
    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={
          overline ??
          (hasSelection ? t('offerForm.selectTypeOfProduct') : undefined)
        }
        headline={headline}
        onPress={onEdit}
      />
    )
  }

  return (
    <>
      <EditRow
        state="initial"
        headline={t('offerForm.selectTypeOfProduct')}
        showInitialIcon={showInitialIcon}
      />
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <YStack gap="$5" paddingVertical="$5">
          <XStack flexWrap="wrap" gap="$3">
            {productCategoryOptions.map((category) => (
              <FilterTag
                key={category}
                label={t(`filterOffers.productCategory.${category}`)}
                icon={productCategoryIcons[category]}
                selected={
                  Option.getOrUndefined(selectedCategoryOption) === category
                }
                onPress={() => {
                  selectProductCategory(category)
                }}
              />
            ))}
          </XStack>
          <Button
            variant="primary"
            size="large"
            disabled={!hasSelection}
            onPress={onComplete}
          >
            {ctaLabel ?? t('offerForm.next')}
          </Button>
        </YStack>
      </Animated.View>
    </>
  )
}

export default ProductCategoryStep
