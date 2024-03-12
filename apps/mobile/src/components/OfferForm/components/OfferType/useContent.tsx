import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../../../ModifyOffer/atoms/offerFormStateAtoms'
import {type TabProps} from '../../../Tabs'

export default function useContent(): Array<TabProps<OfferType>> {
  const {t} = useTranslation()
  const {listingTypeAtom} = useMolecule(offerFormMolecule)
  const listingType = useAtomValue(listingTypeAtom)

  return useMemo(
    () => [
      {
        title:
          listingType === 'BITCOIN'
            ? t('offerForm.sellBitcoin')
            : listingType === 'PRODUCT'
            ? t('offerForm.sellItem')
            : t('offerForm.offer'),
        type: 'SELL',
      },
      {
        title:
          listingType === 'BITCOIN'
            ? t('offerForm.buyBitcoin')
            : listingType === 'PRODUCT'
            ? t('offerForm.buyItem')
            : t('offerForm.request'),
        type: 'BUY',
      },
    ],
    [listingType, t]
  )
}
