import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {singlePriceStateAtom} from '../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import DeliveryMethod from '../OfferForm/components/DeliveryMethod'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Network from '../OfferForm/components/Network'
import Price from '../OfferForm/components/Price'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import deliveryMethodSvg from '../images/deliveryMethodSvg'
import friendLevelSvg from '../images/friendLevelSvg'
import networkSvg from '../images/networkSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import {
  calculateFiatValueOnSatsValueChangeActionAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  changePriceCurrencyActionAtom,
  createIsThisLanguageSelectedAtom,
  intendedConnectionLevelAtom,
  locationArrayOfOneAtom,
  locationStateAtom,
  removeSpokenLanguageActionAtom,
  resetSpokenLanguagesToInitialStateActionAtom,
  satsValueAtom,
  saveSelectedSpokenLanguagesActionAtom,
  singlePriceAtom,
  singlePriceCurrencyAtom,
  spokenLanguagesAtomsAtom,
  updateBtcNetworkAtom,
  updateLocationStateAndPaymentMethodAtom,
} from './atom'

export default function useProductOffersFilterContent(): Props[] {
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
        title: t('offerForm.deliveryMethod'),
        image: deliveryMethodSvg,
        children: (
          <DeliveryMethod
            locationStateAtom={locationStateAtom}
            updateLocationStateAndPaymentMethodAtom={
              updateLocationStateAndPaymentMethodAtom
            }
            locationAtom={locationArrayOfOneAtom}
            randomizeLocation={false}
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
