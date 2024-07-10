import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {useAtom, useAtomValue, type PrimitiveAtom} from 'jotai'
import {useCallback, useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Tabs, {type TabProps} from '../../../Tabs'

interface Props {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  offerTypeAtom: PrimitiveAtom<OfferType | undefined>
}

function OfferTypeSection({
  listingTypeAtom,
  offerTypeAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const listingType = useAtomValue(listingTypeAtom)
  const [offerType, setOfferType] = useAtom(offerTypeAtom)

  const tabsContent: Array<TabProps<OfferType>> = useMemo(
    () => [
      {
        testID: 'offer-type-SELL',
        title:
          !listingType || listingType === 'BITCOIN'
            ? t('offerForm.sellBitcoin')
            : listingType === 'PRODUCT'
              ? t('offerForm.sellItem')
              : t('offerForm.offer'),
        type: 'SELL',
      },
      {
        testID: 'offer-type-BUY',
        title:
          !listingType || listingType === 'BITCOIN'
            ? t('offerForm.buyBitcoin')
            : listingType === 'PRODUCT'
              ? t('offerForm.buyItem')
              : t('offerForm.request'),
        type: 'BUY',
      },
    ],
    [listingType, t]
  )

  const activeTab = useMemo(() => {
    if (!listingType || listingType === 'BITCOIN') return offerType

    // need to revert offerType for product/other offers
    // user is selling BTC to buy goods and opposite
    if (offerType === 'BUY') return 'SELL'
    if (offerType === 'SELL') return 'BUY'

    return undefined
  }, [listingType, offerType])

  const onTabPress = useCallback(
    (offerType: OfferType) => {
      // need to revert offerType for product/other offers
      // user is selling BTC to buy goods and opposite
      setOfferType(
        listingType === 'BITCOIN'
          ? offerType
          : offerType === 'BUY'
            ? 'SELL'
            : 'BUY'
      )
    },
    [listingType, setOfferType]
  )

  return (
    <Tabs activeTab={activeTab} onTabPress={onTabPress} tabs={tabsContent} />
  )
}

export default OfferTypeSection
