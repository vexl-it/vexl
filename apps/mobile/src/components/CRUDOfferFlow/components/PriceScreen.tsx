import {useMolecule} from 'bunshi/dist/react'
import Expiration from '../../OfferForm/components/Expiration'
import Price from '../../OfferForm/components/Price'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function PriceScreen(): JSX.Element {
  const {
    amountBottomLimitAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    currencyAtom,
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
      />
      <Expiration
        expirationDateAtom={expirationDateAtom}
        offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
      />
    </ScreenWrapper>
  )
}

export default PriceScreen
