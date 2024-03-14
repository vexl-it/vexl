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
    amountBottomLimitAtom,
    btcNetworkAtom,
    currencyAtom,
    offerTypeAtom,
    listingTypeAtom,
    offerDescriptionAtom,
    intendedConnectionLevelAtom,
    locationAtom,
    locationStateAtom,
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
    changePriceCurrencyActionAtom,
    updateLocationStateAndPaymentMethodAtom,
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
        title: t('offerForm.price'),
        children: (
          <Price
            amountBottomLimitAtom={amountBottomLimitAtom}
            calculateSatsValueOnFiatValueChangeActionAtom={
              calculateSatsValueOnFiatValueChangeActionAtom
            }
            calculateFiatValueOnSatsValueChangeActionAtom={
              calculateFiatValueOnSatsValueChangeActionAtom
            }
            currencyAtom={currencyAtom}
            satsValueAtom={satsValueAtom}
            singlePriceStateAtom={singlePriceStateAtom}
            changePriceCurrencyActionAtom={changePriceCurrencyActionAtom}
          />
        ),
      },
      {
        customSection: true,
        title: t('offerForm.expiration.expiration'),
        children: (
          <Expiration
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
            randomizeLocation
            locationAtom={locationAtom}
            locationStateAtom={locationStateAtom}
            updateLocationStateAndPaymentMethodAtom={
              updateLocationStateAndPaymentMethodAtom
            }
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
      amountBottomLimitAtom,
      calculateSatsValueOnFiatValueChangeActionAtom,
      calculateFiatValueOnSatsValueChangeActionAtom,
      currencyAtom,
      satsValueAtom,
      singlePriceStateAtom,
      changePriceCurrencyActionAtom,
      expirationDateAtom,
      offerExpirationModalVisibleAtom,
      locationAtom,
      locationStateAtom,
      updateLocationStateAndPaymentMethodAtom,
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
