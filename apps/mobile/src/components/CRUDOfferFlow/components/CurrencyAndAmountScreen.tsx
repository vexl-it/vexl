import {useMolecule} from 'bunshi/dist/react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import AmountOfTransaction from '../../OfferForm/components/AmountOfTransaction'
import Currency from '../../OfferForm/components/Currency'
import PremiumOrDiscount from '../../OfferForm/components/PremiumOrDiscount'
import Section from '../../Section'
import amountOfTransactionSvg from '../../images/amountOfTransactionSvg'
import coinsSvg from '../../images/coinsSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function CurrencyAndAmountScreen(): JSX.Element {
  const {t} = useTranslation()
  const {
    currencyAtom,
    updateCurrencyLimitsAtom,
    amountTopLimitAtom,
    amountBottomLimitAtom,
    offerTypeOrDummyValueAtom,
    feeAmountAtom,
    feeStateAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper testID="currency-and-amount-screen">
      <Section title={t('common.currency')} image={coinsSvg}>
        <Currency
          currencyAtom={currencyAtom}
          updateCurrencyLimitsAtom={updateCurrencyLimitsAtom}
        />
      </Section>
      <Section
        title={t('offerForm.amountOfTransaction.amountOfTransaction')}
        image={amountOfTransactionSvg}
      >
        <AmountOfTransaction
          amountTopLimitAtom={amountTopLimitAtom}
          amountBottomLimitAtom={amountBottomLimitAtom}
          currencyAtom={currencyAtom}
        />
      </Section>
      <PremiumOrDiscount
        offerTypeAtom={offerTypeOrDummyValueAtom}
        feeAmountAtom={feeAmountAtom}
        feeStateAtom={feeStateAtom}
      />
    </ScreenWrapper>
  )
}

export default CurrencyAndAmountScreen
