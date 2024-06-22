import {useMolecule} from 'bunshi/dist/react'
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
    </ScreenWrapper>
  )
}

export default PriceScreen
