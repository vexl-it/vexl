import {
  type ProductCategory,
  productCategoryOptions,
} from '@vexl-next/domain/src/general/offers'
import {
  Collapse,
  Divider,
  FilterTag,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {productCategoryIcons} from '../../../utils/productCategoryIcons'
import {
  isProductFilterActiveAtom,
  isThisProductCategorySelectedAtomFamily,
} from '../atom'

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
    <Collapse expanded={isProductFilterActive}>
      <YStack>
        <Divider marginVertical="$5" />
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
    </Collapse>
  )
}

export default ProductCategorySection
