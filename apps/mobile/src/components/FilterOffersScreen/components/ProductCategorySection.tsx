import {
  type ProductCategory,
  productCategoryOptions,
} from '@vexl-next/domain/src/general/offers'
import {FilterTag, Typography} from '@vexl-next/ui'
import {
  BoltElectric,
  BoxProduct,
  CherriesFoodFruit,
  GoldBricks,
  More,
} from '@vexl-next/ui/src/icons'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {Separator, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  isProductFilterActiveAtom,
  isThisProductCategorySelectedAtomFamily,
} from '../atom'
import AnimatedCollapse from './AnimatedCollapse'

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

function ProductCategoryTag({
  category,
}: {
  readonly category: ProductCategory
}): React.JSX.Element {
  const {t} = useTranslation()
  const [selected, setSelected] = useAtom(
    isThisProductCategorySelectedAtomFamily(category)
  )

  return (
    <FilterTag
      label={t(`filterOffers.productCategory.${category}`)}
      icon={productCategoryIcons[category]}
      selected={selected}
      onPress={() => {
        setSelected((prev) => !prev)
      }}
    />
  )
}

function ProductCategorySection(): React.JSX.Element {
  const {t} = useTranslation()
  const isProductFilterActive = useAtomValue(isProductFilterActiveAtom)

  return (
    <AnimatedCollapse expanded={isProductFilterActive}>
      <YStack>
        <Separator marginVertical="$5" borderColor="$backgroundTertiary" />
        <Typography
          variant="titlesSmall"
          color="$foregroundPrimary"
          paddingVertical="$3"
        >
          {t('filterOffers.typeOfProducts')}
        </Typography>
        <XStack flexWrap="wrap" gap="$3">
          {productCategoryOptions.map((category) => (
            <ProductCategoryTag key={category} category={category} />
          ))}
        </XStack>
      </YStack>
    </AnimatedCollapse>
  )
}

export default ProductCategorySection
