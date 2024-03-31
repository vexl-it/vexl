import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {singlePriceStateAtom} from '../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Location from '../OfferForm/components/Location'
import Network from '../OfferForm/components/Network'
import Price from '../OfferForm/components/Price'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import friendLevelSvg from '../images/friendLevelSvg'
import locationSvg from '../images/locationSvg'
import networkSvg from '../images/networkSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import {
  calculateFiatValueOnSatsValueChangeActionAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  changePriceCurrencyActionAtom,
  createIsThisLanguageSelectedAtom,
  intendedConnectionLevelAtom,
  listingTypeAtom,
  locationArrayOfOneAtom,
  locationStateAtom,
  removeSpokenLanguageActionAtom,
  resetSpokenLanguagesToInitialStateActionAtom,
  satsValueAtom,
  saveSelectedSpokenLanguagesActionAtom,
  setOfferLocationActionAtom,
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
            singlePriceStateAtom={singlePriceStateAtom}
            priceAtom={singlePriceAtom}
            changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
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
    ],
    [t, tokens.color.white.val]
  )
}