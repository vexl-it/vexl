import {useTranslation} from '../../utils/localization/I18nProvider'
import {useMemo} from 'react'
import sortingSvg from '../images/sortingSvg'
import Sorting from './components/Sorting'
import locationSvg from '../images/locationSvg'
import amountOfTransactionSvg from '../images/amountOfTransactionSvg'
import paymentMethodSvg from '../images/paymentMethod'
import networkSvg from '../images/networkSvg'
import friendLevelSvg from '../images/friendLevelSvg'
import {type Props} from '../Section'
import coinsSvg from '../images/coinsSvg'
import TextFilter from './components/TextFilter'
import magnifyingGlass from '../images/magnifyingGlass'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import {getTokens} from 'tamagui'
import Currency from '../OfferForm/components/Currency'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import Location from '../OfferForm/components/Location'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import PaymentMethod from '../OfferForm/components/PaymentMethod'
import Network from '../OfferForm/components/Network'
import FriendLevel from '../OfferForm/components/FriendLevel'
import {
  amountBottomLimitAtom,
  amountTopLimitAtom,
  currencyAtom,
  updateCurrencyLimitsAtom,
  locationAtom,
  locationStateAtom,
  updateLocationStatePaymentMethodAtom,
  spokenLanguagesAtomsAtom,
  saveSelectedSpokenLanguagesActionAtom,
  resetSpokenLanguagesToInitialStateActionAtom,
  removeSpokenLanguageActionAtom,
  createIsThisLanguageSelectedAtom,
  paymentMethodAtom,
  btcNetworkAtom,
  intendedConnectionLevelAtom,
  sortingAtom,
  setOfferLocationActionAtom,
} from './atom'

export default function useContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()

  return useMemo(
    () => [
      {
        title: t('filterOffers.searchByText'),
        image: magnifyingGlass,
        children: <TextFilter />,
      },
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
            setOfferLocationActionAtom={setOfferLocationActionAtom}
            updateLocationStatePaymentMethodAtom={
              updateLocationStatePaymentMethodAtom
            }
          />
        ),
      },
      {
        title: t('offerForm.spokenLanguages.language'),
        image: spokenLanguagesSvg,
        imageFill: tokens.color.white.val,
        children: (
          <SpokenLanguages
            createIsThisLanguageSelectedAtom={createIsThisLanguageSelectedAtom}
            removeSpokenLanguageActionAtom={removeSpokenLanguageActionAtom}
            resetSelectedSpokenLanguagesActionAtom={
              resetSpokenLanguagesToInitialStateActionAtom
            }
            saveSelectedSpokenLanguagesActionAtom={
              saveSelectedSpokenLanguagesActionAtom
            }
            spokenLanguagesAtomsAtom={spokenLanguagesAtomsAtom}
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
            hideSubtitle
            intendedConnectionLevelAtom={intendedConnectionLevelAtom}
          />
        ),
      },
    ],
    [t, tokens.color.white.val]
  )
}
