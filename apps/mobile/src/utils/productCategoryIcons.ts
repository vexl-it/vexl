import {type ProductCategory} from '@vexl-next/domain/src/general/offers'
import {
  BoltElectric,
  BoxProduct,
  CherriesFoodFruit,
  GoldBricks,
  More,
  type IconProps,
} from '@vexl-next/ui'
import type React from 'react'

export const productCategoryIcons: Record<
  ProductCategory,
  React.ComponentType<IconProps>
> = {
  PRECIOUS_METALS: GoldBricks,
  PRODUCE: CherriesFoodFruit,
  ELECTRONICS: BoltElectric,
  ASSETS: BoxProduct,
  OTHERS: More,
}
