import {type PrimitiveAtom} from 'jotai'
import React from 'react'
import PremiumOrDiscountContent from '../../../PremiumOrDiscountContent'
import PriceTypeIndicator from '../PriceTypeIndicator'

interface Props {
  iAmTheBuyer: boolean
  tempFeeAmountAtom: PrimitiveAtom<number>
}

function PremiumOrDiscount({
  iAmTheBuyer,
  tempFeeAmountAtom,
}: Props): React.ReactElement {
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
