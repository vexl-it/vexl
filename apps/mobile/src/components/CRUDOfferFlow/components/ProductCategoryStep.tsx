import {productCategoryOptions} from '@vexl-next/domain/src/general/offers'
import {Button, EditStep, FilterTag, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {productCategoryIcons} from '../../../utils/productCategoryIcons'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'

interface ProductCategoryStepProps extends OfferFormStepProps {
  readonly missing?: boolean
  readonly missingHeadline?: string
}

function ProductCategoryStep({
  onComplete,
  ctaLabel,
  missing = false,
  missingHeadline,
  ...stepProps
}: ProductCategoryStepProps): React.ReactElement {
  const {t} = useTranslation()
  const {productCategoriesAtom, selectProductCategoryActionAtom} =
    useMolecule(offerFormMolecule)
  const productCategories = useAtomValue(productCategoriesAtom)
  const selectProductCategory = useSetAtom(selectProductCategoryActionAtom)

  const selectedCategory = pipe(
    Option.fromNullable(productCategories),
    Option.flatMap(Array.head),
    Option.getOrUndefined
  )
  const showMissingState = missing && !selectedCategory
  const title = t('offerForm.selectTypeOfProduct')

  return (
    <EditStep
      {...stepProps}
      title={title}
      value={
        selectedCategory
          ? t(`filterOffers.productCategory.${selectedCategory}`)
          : showMissingState
            ? (missingHeadline ?? title)
            : title
      }
      invalid={showMissingState}
    >
      <XStack flexWrap="wrap" gap="$3">
        {productCategoryOptions.map((category) => (
          <FilterTag
            key={category}
            label={t(`filterOffers.productCategory.${category}`)}
            icon={productCategoryIcons[category]}
            selected={selectedCategory === category}
            onPress={() => {
              selectProductCategory(category)
            }}
          />
        ))}
      </XStack>
      <Button
        variant="primary"
        size="large"
        disabled={!selectedCategory}
        onPress={onComplete}
      >
        {ctaLabel ?? t('offerForm.next')}
      </Button>
    </EditStep>
  )
}

export default ProductCategoryStep
