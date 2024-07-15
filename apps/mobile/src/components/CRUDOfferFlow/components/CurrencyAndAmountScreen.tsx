import {useMolecule} from 'bunshi/dist/react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import AmountOfTransaction from '../../OfferForm/components/AmountOfTransaction'
import Currency from '../../OfferForm/components/Currency'
import Expiration from '../../OfferForm/components/Expiration'
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
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
    feeAmountAtom,
    feeStateAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper>
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
      <Expiration
        expirationDateAtom={expirationDateAtom}
        offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
      />
    </ScreenWrapper>
  )
}

export default CurrencyAndAmountScreen
