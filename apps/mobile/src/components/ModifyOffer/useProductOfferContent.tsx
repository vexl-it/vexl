import {useMolecule} from 'bunshi/dist/react'
import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import DeliveryMethod from '../OfferForm/components/DeliveryMethod'
import Description from '../OfferForm/components/Description'
import Expiration from '../OfferForm/components/Expiration'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Network from '../OfferForm/components/Network'
import Price from '../OfferForm/components/Price'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import deliveryMethodSvg from '../images/deliveryMethodSvg'
import friendLevelSvg from '../images/friendLevelSvg'
import networkSvg from '../images/networkSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import descriptionSvg from './images/descriptionSvg'

export default function useProductOfferContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()
  const {
    btcNetworkAtom,
    currencyAtom,
    deliveryMethodAtom,
    offerTypeAtom,
    listingTypeAtom,
    offerDescriptionAtom,
    intendedConnectionLevelAtom,
    locationAtom,
    singlePriceValueAtom,
    singlePriceStateAtom,
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
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
    changeDeliveryMethodActionAtom,
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
        customSection: true,
        children: (
          <Expiration
            key={t('offerForm.expiration.expiration')}
            expirationDateAtom={expirationDateAtom}
            offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
          />
        ),
      },
      {
        title: t('offerForm.deliveryMethod'),
        image: deliveryMethodSvg,
        children: (
          <DeliveryMethod
            changeDeliveryMethodActionAtom={changeDeliveryMethodActionAtom}
            deliveryMethodAtom={deliveryMethodAtom}
            locationAtom={locationAtom}
            randomizeLocation
          />
        ),
        mandatory: true,
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
        mandatory: true,
      },
      {
        title: t('offerForm.network.network'),
        image: networkSvg,
        children: <Network btcNetworkAtom={btcNetworkAtom} />,
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
      t,
      offerDescriptionAtom,
      listingTypeAtom,
      offerTypeAtom,
      btcPriceForOfferWithCurrencyAtom,
      calculateSatsValueOnFiatValueChangeActionAtom,
      calculateFiatValueOnSatsValueChangeActionAtom,
      currencyAtom,
      satsValueAtom,
      singlePriceValueAtom,
      singlePriceStateAtom,
      toggleCurrencyActionAtom,
      expirationDateAtom,
      offerExpirationModalVisibleAtom,
      changeDeliveryMethodActionAtom,
      deliveryMethodAtom,
      locationAtom,
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