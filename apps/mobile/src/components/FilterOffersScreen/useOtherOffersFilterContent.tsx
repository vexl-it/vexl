import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import clubsSvg from '../images/clubsSvg'
import friendLevelSvg from '../images/friendLevelSvg'
import networkSvg from '../images/networkSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import ClubsComponent from '../OfferForm/components/Clubs'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Location from '../OfferForm/components/Location'
import Network from '../OfferForm/components/Network'
import Price from '../OfferForm/components/Price'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import {
  calculateFiatValueOnSatsValueChangeActionAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  changePriceCurrencyActionAtom,
  createIsThisLanguageSelectedAtom,
  createSelectClubInFilterAtom,
  currencySelectVisibleAtom,
  handleShowClubsInFilterChangeActionAtom,
  intendedConnectionLevelAtom,
  listingTypeAtom,
  locationActiveAtom,
  locationArrayOfOneAtom,
  locationStateAtom,
  removeSpokenLanguageActionAtom,
  resetSpokenLanguagesToInitialStateActionAtom,
  satsValueAtom,
  saveSelectedSpokenLanguagesActionAtom,
  setOfferLocationActionAtom,
  singlePriceActiveAtom,
  singlePriceAtom,
  singlePriceCurrencyAtom,
  spokenLanguagesAtomsAtom,
  updateBtcNetworkAtom,
  updateLocationStateAndPaymentMethodAtom,
} from './atom'

export default function useOtherOffersFilterContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()

  return useMemo(
    () => [
      {
        customSection: true,
        title: t('filterOffers.priceUpTo'),
        children: (
          <Price
            inFilter
            currencyAtom={singlePriceCurrencyAtom}
            calculateSatsValueOnFiatValueChangeActionAtom={
              calculateSatsValueOnFiatValueChangeActionAtom
            }
            calculateFiatValueOnSatsValueChangeActionAtom={
              calculateFiatValueOnSatsValueChangeActionAtom
            }
            satsValueAtom={satsValueAtom}
            toggleSinglePriceActiveAtom={singlePriceActiveAtom}
            priceAtom={singlePriceAtom}
            changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
            currencySelectVisibleAtom={currencySelectVisibleAtom}
          />
        ),
      },
      {
        customSection: true,
        title: t('offerForm.location.location'),
        children: (
          <Location
            inFilter
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
            showClubsInFilterAtom={handleShowClubsInFilterChangeActionAtom}
          />
        ),
      },
    ],
    [t, tokens.color.white.val]
  )
}
