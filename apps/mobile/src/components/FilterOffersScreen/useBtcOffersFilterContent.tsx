import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import amountOfTransactionSvg from '../images/amountOfTransactionSvg'
import clubsSvg from '../images/clubsSvg'
import coinsSvg from '../images/coinsSvg'
import friendLevelSvg from '../images/friendLevelSvg'
import networkSvg from '../images/networkSvg'
import paymentMethodSvg from '../images/paymentMethod'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import ClubsComponent from '../OfferForm/components/Clubs'
import Currency from '../OfferForm/components/Currency'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Location from '../OfferForm/components/Location'
import Network from '../OfferForm/components/Network'
import PaymentMethod from '../OfferForm/components/PaymentMethod'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import {
  amountBottomLimitAtom,
  amountTopLimitAtom,
  createIsThisLanguageSelectedAtom,
  createSelectClubInFilterAtom,
  currencyAtom,
  intendedConnectionLevelAtom,
  listingTypeAtom,
  locationActiveAtom,
  locationArrayOfOneAtom,
  locationStateAtom,
  paymentMethodAtom,
  removeSpokenLanguageActionAtom,
  resetSpokenLanguagesToInitialStateActionAtom,
  saveSelectedSpokenLanguagesActionAtom,
  setOfferLocationActionAtom,
  spokenLanguagesAtomsAtom,
  updateBtcNetworkAtom,
  updateCurrencyLimitsAtom,
  updateLocationStateAndPaymentMethodAtom,
} from './atom'

export default function useBtcOffersFilterContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()

  return useMemo(
    () => [
      {
        title: t('common.currency'),
        image: coinsSvg,
        children: (
          <Currency
            hideInFilter
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
        customSection: true,
        title: t('offerForm.location.location'),
        children: (
          <Location
            listingTypeAtom={listingTypeAtom}
            randomizeLocation={false}
            locationAtom={locationArrayOfOneAtom}
            locationStateAtom={locationStateAtom}
            setOfferLocationActionAtom={setOfferLocationActionAtom}
            toggleLocationActiveAtom={locationActiveAtom}
            updateLocationStateAndPaymentMethodAtom={
              updateLocationStateAndPaymentMethodAtom
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
        children: <Network btcNetworkAtom={updateBtcNetworkAtom} />,
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
      {
        customSection: true,
        title: t('clubs.vexlClubs'),
        image: clubsSvg,
        children: (
          <ClubsComponent
            form="FilterForm"
            createSelectClubAtom={createSelectClubInFilterAtom}
          />
        ),
      },
    ],
    [t, tokens.color.white.val]
  )
}
