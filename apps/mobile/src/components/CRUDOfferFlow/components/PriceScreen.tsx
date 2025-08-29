import {useMolecule} from 'bunshi/dist/react'
import React from 'react'
import Expiration from '../../OfferForm/components/Expiration'
import Price from '../../OfferForm/components/Price'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function PriceScreen(): React.ReactElement {
  const {
    amountBottomLimitAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    currencyAtom,
    currencySelectVisibleAtom,
    satsValueAtom,
    toggleSinglePriceActiveAtom,
    changePriceCurrencyActionAtom,
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper>
      <Price
        priceAtom={amountBottomLimitAtom}
        calculateSatsValueOnFiatValueChangeActionAtom={
          calculateSatsValueOnFiatValueChangeActionAtom
        }
        calculateFiatValueOnSatsValueChangeActionAtom={
          calculateFiatValueOnSatsValueChangeActionAtom
        }
        currencyAtom={currencyAtom}
        satsValueAtom={satsValueAtom}
        toggleSinglePriceActiveAtom={toggleSinglePriceActiveAtom}
        changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
        currencySelectVisibleAtom={currencySelectVisibleAtom}
      />
      <Expiration
        expirationDateAtom={expirationDateAtom}
        offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
      />
    </ScreenWrapper>
  )
}

export default PriceScreen
