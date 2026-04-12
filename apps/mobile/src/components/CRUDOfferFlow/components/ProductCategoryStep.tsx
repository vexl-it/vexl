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
}

function ProductCategoryStep({
  active,
  onEdit,
  onComplete,
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

  return (
    <>
      {active || Option.isNone(selectedCategoryOption) ? (
        <EditRow
          state="initial"
          headline={t('offerForm.selectTypeOfProduct')}
        />
      ) : (
        <EditRow
          state="completed"
          overline={t('offerForm.selectTypeOfProduct')}
          headline={t(
            `filterOffers.productCategory.${selectedCategoryOption.value}`
          )}
          onPress={onEdit}
        />
      )}
      {active ? (
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
              {t('offerForm.next')}
            </Button>
          </YStack>
        </Animated.View>
      ) : null}
    </>
  )
}

export default ProductCategoryStep
