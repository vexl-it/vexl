import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {type Atom, type PrimitiveAtom} from 'jotai'
import PremiumOrDiscountContent from '../../../PremiumOrDiscountContent'
import PriceTypeIndicator from '../PriceTypeIndicator'

interface Props {
  tempFeeAmountAtom: PrimitiveAtom<number>
  offerTypeAtom: Atom<OfferType | undefined>
}

function PremiumOrDiscount({
  offerTypeAtom,
  tempFeeAmountAtom,
}: Props): JSX.Element {
  return (
    <>
      <PremiumOrDiscountContent
        proceedToDetailDisabled
        feeAmountAtom={tempFeeAmountAtom}
        offerTypeAtom={offerTypeAtom}
      >
        <PriceTypeIndicator displayInGrayColor mr="$2" />
      </PremiumOrDiscountContent>
    </>
  )
}

export default PremiumOrDiscount
