import {type PrimitiveAtom} from 'jotai'
import PremiumOrDiscountContent from '../../../PremiumOrDiscountContent'
import PriceTypeIndicator from '../PriceTypeIndicator'

interface Props {
  iAmTheBuyer: boolean
  tempFeeAmountAtom: PrimitiveAtom<number>
}

function PremiumOrDiscount({
  iAmTheBuyer,
  tempFeeAmountAtom,
}: Props): JSX.Element {
  return (
    <>
      <PremiumOrDiscountContent
        proceedToDetailDisabled
        feeAmountAtom={tempFeeAmountAtom}
        iAmTheBuyer={iAmTheBuyer}
      >
        <PriceTypeIndicator displayInGrayColor mr="$2" />
      </PremiumOrDiscountContent>
    </>
  )
}

export default PremiumOrDiscount
