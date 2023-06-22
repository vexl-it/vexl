import {useTranslation} from '../../utils/localization/I18nProvider'
import userSvg from './images/userSvg'
import {useMemo} from 'react'
import Currency from '../OfferForm/components/Currency'
import OfferType from '../OfferForm/components/OfferType'
import amountOfTransactionSvg from '../images/amountOfTransactionSvg'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import locationSvg from '../images/locationSvg'
import Location from '../OfferForm/components/Location'
import paymentMethodSvg from '../images/paymentMethod'
import PaymentMethod from '../OfferForm/components/PaymentMethod'
import networkSvg from '../images/networkSvg'
import Network from '../OfferForm/components/Network'
import descriptionSvg from './images/descriptionSvg'
import Description from '../OfferForm/components/Description'
import friendLevelSvg from '../images/friendLevelSvg'
import FriendLevel from '../OfferForm/components/FriendLevel'
import PremiumOrDiscount from '../OfferForm/components/PremiumOrDiscount'
import {useMolecule} from 'jotai-molecules'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import {type SectionProps} from '../Section'
import coinsSvg from '../images/coinsSvg'

export default function useContent(): SectionProps[] {
  const {t} = useTranslation()
  const {
    amountTopLimitAtom,
    amountBottomLimitAtom,
    amountBottomLimitUsdEurCzkAtom,
    amountTopLimitCzkAtom,
    amountTopLimitUsdEurAtom,
    btcNetworkAtom,
    currencyAtom,
    feeAmountAtom,
    feeStateAtom,
    offerDescriptionAtom,
    offerTypeAtom,
    intendedConnectionLevelAtom,
    locationAtom,
    locationStateAtom,
    paymentMethodAtom,
    updateCurrencyLimitsAtom,
    updateLocationStatePaymentMethodAtom,
  } = useMolecule(offerFormMolecule)

  return useMemo(
    () => [
      {
        title: t('offerForm.iWantTo'),
        image: userSvg,
        children: <OfferType offerTypeAtom={offerTypeAtom} />,
      },
      {
        title: t('common.currency'),
        image: coinsSvg,
        children: (
          <Currency
            currencyAtom={currencyAtom}
            updateCurrencyLimitsAtom={updateCurrencyLimitsAtom}
          />
        ),
      },
      {
        title: t('offerForm.amountOfTransaction.amountOfTransaction'),
        image: amountOfTransactionSvg,
        children: (
          <AmountOfTransaction
            amountTopLimitAtom={amountTopLimitAtom}
            amountBottomLimitAtom={amountBottomLimitAtom}
            amountBottomLimitUsdEurCzkAtom={amountBottomLimitUsdEurCzkAtom}
            amountTopLimitCzkAtom={amountTopLimitCzkAtom}
            amountTopLimitUsdEurAtom={amountTopLimitUsdEurAtom}
            currencyAtom={currencyAtom}
          />
        ),
      },
      {
        title: t('offerForm.premiumOrDiscount.premiumOrDiscount'),
        customSection: true,
        children: (
          <PremiumOrDiscount
            offerTypeAtom={offerTypeAtom}
            feeAmountAtom={feeAmountAtom}
            feeStateAtom={feeStateAtom}
          />
        ),
      },
      {
        title: t('offerForm.location.location'),
        image: locationSvg,
        children: (
          <Location
            locationAtom={locationAtom}
            locationStateAtom={locationStateAtom}
            updateLocationStatePaymentMethodAtom={
              updateLocationStatePaymentMethodAtom
            }
          />
        ),
        mandatory: true,
      },
      {
        title: t('offerForm.paymentMethod.paymentMethod'),
        image: paymentMethodSvg,
        children: (
          <PaymentMethod
            locationStateAtom={locationStateAtom}
            paymentMethodAtom={paymentMethodAtom}
          />
        ),
        mandatory: true,
      },
      {
        title: t('offerForm.network.network'),
        image: networkSvg,
        children: <Network btcNetworkAtom={btcNetworkAtom} />,
        mandatory: true,
      },
      {
        title: t('offerForm.description.description'),
        image: descriptionSvg,
        children: <Description offerDescriptionAtom={offerDescriptionAtom} />,
        mandatory: true,
      },
      {
        title: t('offerForm.friendLevel.friendLevel'),
        image: friendLevelSvg,
        children: (
          <FriendLevel
            intendedConnectionLevelAtom={intendedConnectionLevelAtom}
          />
        ),
      },
    ],
    [
      amountBottomLimitAtom,
      amountBottomLimitUsdEurCzkAtom,
      amountTopLimitAtom,
      amountTopLimitCzkAtom,
      amountTopLimitUsdEurAtom,
      btcNetworkAtom,
      currencyAtom,
      feeAmountAtom,
      feeStateAtom,
      intendedConnectionLevelAtom,
      locationAtom,
      locationStateAtom,
      offerDescriptionAtom,
      offerTypeAtom,
      paymentMethodAtom,
      t,
      updateCurrencyLimitsAtom,
      updateLocationStatePaymentMethodAtom,
    ]
  )
}
