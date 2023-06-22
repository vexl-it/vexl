import {useTranslation} from '../../utils/localization/I18nProvider'
import {useMemo} from 'react'
import sortingSvg from '../images/sortingSvg'
import Sorting from './components/Sorting'
import AmountOfTransaction from './components/AmountOfTransaction'
import PaymentMethod from './components/PaymentMethod'
import locationSvg from '../images/locationSvg'
import Location from './components/Location'
import amountOfTransactionSvg from '../images/amountOfTransactionSvg'
import paymentMethodSvg from '../images/paymentMethod'
import Network from './components/Network'
import networkSvg from '../images/networkSvg'
import FriendLevel from './components/FriendLevel'
import friendLevelSvg from '../images/friendLevelSvg'
import Currency from './components/Currency'
import {type SectionProps} from '../Section'
import coinsSvg from '../images/coinsSvg'
import {
  amountBottomLimitAtom,
  amountBottomLimitUsdEurCzkAtom,
  amountTopLimitCzkAtom,
  amountTopLimitUsdEurAtom,
  amountTopLimitAtom,
  currencyAtom,
  locationAtom,
  sortingAtom,
  updateCurrencyLimitsAtom,
  locationStateAtom,
  updateLocationStatePaymentMethodAtom,
  paymentMethodAtom,
  btcNetworkAtom,
  intendedConnectionLevelAtom,
} from './atom'

export default function useContent(): SectionProps[] {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('filterOffers.sorting'),
        image: sortingSvg,
        children: <Sorting sortingAtom={sortingAtom} />,
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
      },
      {
        title: t('offerForm.network.network'),
        image: networkSvg,
        children: <Network btcNetworkAtom={btcNetworkAtom} />,
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
    [t]
  )
}
