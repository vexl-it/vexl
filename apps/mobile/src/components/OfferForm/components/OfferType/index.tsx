import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {useAtom, useAtomValue, type PrimitiveAtom} from 'jotai'
import {useCallback, useMemo} from 'react'
import Tabs from '../../../Tabs'
import useContent from './useContent'

interface Props {
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  offerTypeAtom: PrimitiveAtom<OfferType | undefined>
}

function OfferTypeSection({
  listingTypeAtom,
  offerTypeAtom,
}: Props): JSX.Element {
  const content = useContent()
  const listingType = useAtomValue(listingTypeAtom)
  const [offerType, setOfferType] = useAtom(offerTypeAtom)

  const activeTab = useMemo(() => {
    if (listingType === 'BITCOIN') return offerType

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

  return <Tabs activeTab={activeTab} onTabPress={onTabPress} tabs={content} />
}

export default OfferTypeSection
