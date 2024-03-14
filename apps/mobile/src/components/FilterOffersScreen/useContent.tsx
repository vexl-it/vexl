import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import Currency from '../OfferForm/components/Currency'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Location from '../OfferForm/components/Location'
import Network from '../OfferForm/components/Network'
import PaymentMethod from '../OfferForm/components/PaymentMethod'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import amountOfTransactionSvg from '../images/amountOfTransactionSvg'
import coinsSvg from '../images/coinsSvg'
import friendLevelSvg from '../images/friendLevelSvg'
import locationSvg from '../images/locationSvg'
import magnifyingGlass from '../images/magnifyingGlass'
import networkSvg from '../images/networkSvg'
import paymentMethodSvg from '../images/paymentMethod'
import sortingSvg from '../images/sortingSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import {
  amountBottomLimitAtom,
  amountTopLimitAtom,
  btcNetworkAtom,
  createIsThisLanguageSelectedAtom,
  currencyAtom,
  intendedConnectionLevelAtom,
  listingTypeAtom,
  locationArrayOfOneAtom,
  locationStateAtom,
  paymentMethodAtom,
  removeSpokenLanguageActionAtom,
  resetSpokenLanguagesToInitialStateActionAtom,
  saveSelectedSpokenLanguagesActionAtom,
  setOfferLocationActionAtom,
  sortingAtom,
  spokenLanguagesAtomsAtom,
  updateCurrencyLimitsAtom,
  updateLocationStatePaymentMethodAtom,
} from './atom'
import Sorting from './components/Sorting'
import TextFilter from './components/TextFilter'

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
            listingTypeAtom={listingTypeAtom}
            randomizeLocation={false}
            locationAtom={locationArrayOfOneAtom}
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
