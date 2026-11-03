import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {
  BoxProduct,
  CurrencyBitcoinCircle,
  EditStep,
  RowButton,
  Tools,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
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
    <EditStep
      active={active}
      title={t('offerForm.whatAreYouHereFor')}
      value={listingTypeLabel}
      gap="$3"
      onEdit={onEdit}
    >
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
    </EditStep>
  )
}

export default ListingTypeStep
