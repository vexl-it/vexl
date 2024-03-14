import {useMolecule} from 'bunshi/dist/react'
import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Description from '../OfferForm/components/Description'
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
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import descriptionSvg from './images/descriptionSvg'

export default function useOtherOfferContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()
  const {
    btcNetworkAtom,
    currencyAtom,
    offerTypeAtom,
    listingTypeAtom,
    offerDescriptionAtom,
    intendedConnectionLevelAtom,
    singlePriceValueAtom,
    singlePriceStateAtom,
    spokenLanguagesAtomsAtom,
    removeSpokenLanguageActionAtom,
    createIsThisLanguageSelectedAtom,
    resetSelectedSpokenLanguagesActionAtom,
    saveSelectedSpokenLanguagesActionAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    satsValueAtom,
    toggleCurrencyActionAtom,
    btcPriceForOfferWithCurrencyAtom,
    updateLocationStatePaymentMethodAtom,
    setOfferLocationActionAtom,
    locationAtom,
    locationStateAtom,
  } = useMolecule(offerFormMolecule)

  return useMemo(
    () => [
      {
        title: t('offerForm.description.description'),
        image: descriptionSvg,
        children: (
          <Description
            offerDescriptionAtom={offerDescriptionAtom}
            listingTypeAtom={listingTypeAtom}
            offerTypeAtom={offerTypeAtom}
          />
        ),
        mandatory: true,
      },
      {
        title: t('offerForm.location.location'),
        image: locationSvg,
        children: (
          <Location
            listingTypeAtom={listingTypeAtom}
            randomizeLocation
            setOfferLocationActionAtom={setOfferLocationActionAtom}
            locationAtom={locationAtom}
            locationStateAtom={locationStateAtom}
            updateLocationStatePaymentMethodAtom={
              updateLocationStatePaymentMethodAtom
            }
          />
        ),
      },
      {
        customSection: true,
        children: (
          <Price
            key={t('offerForm.price')}
            btcPriceForOfferWithCurrencyAtom={btcPriceForOfferWithCurrencyAtom}
            calculateSatsValueOnFiatValueChangeActionAtom={
              calculateSatsValueOnFiatValueChangeActionAtom
            }
            calculateFiatValueOnSatsValueChangeActionAtom={
              calculateFiatValueOnSatsValueChangeActionAtom
            }
            currencyAtom={currencyAtom}
            satsValueAtom={satsValueAtom}
            singlePriceValueAtom={singlePriceValueAtom}
            singlePriceStateAtom={singlePriceStateAtom}
            toggleCurrencyActionAtom={toggleCurrencyActionAtom}
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
            spokenLanguagesAtomsAtom={spokenLanguagesAtomsAtom}
            removeSpokenLanguageActionAtom={removeSpokenLanguageActionAtom}
            resetSelectedSpokenLanguagesActionAtom={
              resetSelectedSpokenLanguagesActionAtom
            }
            saveSelectedSpokenLanguagesActionAtom={
              saveSelectedSpokenLanguagesActionAtom
            }
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
    [
      t,
      offerDescriptionAtom,
      listingTypeAtom,
      offerTypeAtom,
      setOfferLocationActionAtom,
      locationAtom,
      locationStateAtom,
      updateLocationStatePaymentMethodAtom,
      btcPriceForOfferWithCurrencyAtom,
      calculateSatsValueOnFiatValueChangeActionAtom,
      calculateFiatValueOnSatsValueChangeActionAtom,
      currencyAtom,
      satsValueAtom,
      singlePriceValueAtom,
      singlePriceStateAtom,
      toggleCurrencyActionAtom,
      tokens.color.white.val,
      createIsThisLanguageSelectedAtom,
      spokenLanguagesAtomsAtom,
      removeSpokenLanguageActionAtom,
      resetSelectedSpokenLanguagesActionAtom,
      saveSelectedSpokenLanguagesActionAtom,
      btcNetworkAtom,
      intendedConnectionLevelAtom,
    ]
  )
}
