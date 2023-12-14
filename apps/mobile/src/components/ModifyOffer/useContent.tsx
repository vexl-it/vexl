import {useTranslation} from '../../utils/localization/I18nProvider'
import {useMemo} from 'react'
import Currency from '../OfferForm/components/Currency'
import amountOfTransactionSvg from '../images/amountOfTransactionSvg'
import AmountOfTransaction from '../OfferForm/components/AmountOfTransaction'
import locationSvg from '../images/locationSvg'
import Location from '../OfferForm/components/Location'
import paymentMethodSvg from '../images/paymentMethod'
import PaymentMethod from '../OfferForm/components/PaymentMethod'
import networkSvg from '../images/networkSvg'
import Network from '../OfferForm/components/Network'
import descriptionSvg from './images/descriptionSvg'
import Description from '../OfferForm/components/Description'
import friendLevelSvg from '../images/friendLevelSvg'
import FriendLevel from '../OfferForm/components/FriendLevel'
import PremiumOrDiscount from '../OfferForm/components/PremiumOrDiscount'
import {useMolecule} from 'jotai-molecules'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import {type Props} from '../Section'
import coinsSvg from '../images/coinsSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {getTokens} from 'tamagui'
import Expiration from '../OfferForm/components/Expiration'

export default function useContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()
  const {
    amountTopLimitAtom,
    amountBottomLimitAtom,
    btcNetworkAtom,
    currencyAtom,
    feeAmountAtom,
    feeStateAtom,
    offerDescriptionAtom,
    offerTypeOrDummyValueAtom,
    intendedConnectionLevelAtom,
    locationAtom,
    locationStateAtom,
    paymentMethodAtom,
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
    updateCurrencyLimitsAtom,
    updateLocationStatePaymentMethodAtom,
    locationSuggestionsAtom,
    locationSuggestionsAtomsAtom,
    updateAndRefreshLocationSuggestionsActionAtom,
    setOfferLocationActionAtom,
    spokenLanguagesAtomsAtom,
    removeSpokenLanguageActionAtom,
    createIsThisLanguageSelectedAtom,
    resetSelectedSpokenLanguagesActionAtom,
    saveSelectedSpokenLanguagesActionAtom,
  } = useMolecule(offerFormMolecule)

  return useMemo(
    () => [
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
        title: t('offerForm.premiumOrDiscount.premiumOrDiscount'),
        customSection: true,
        children: (
          <PremiumOrDiscount
            offerTypeAtom={offerTypeOrDummyValueAtom}
            feeAmountAtom={feeAmountAtom}
            feeStateAtom={feeStateAtom}
          />
        ),
      },
      {
        title: t('offerForm.expiration.expiration'),
        customSection: true,
        children: (
          <Expiration
            expirationDateAtom={expirationDateAtom}
            offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
          />
        ),
      },
      {
        title: t('offerForm.location.location'),
        image: locationSvg,
        children: (
          <Location
            setOfferLocationActionAtom={setOfferLocationActionAtom}
            locationSuggestionsAtom={locationSuggestionsAtom}
            locationSuggestionsAtomsAtom={locationSuggestionsAtomsAtom}
            updateAndRefreshLocationSuggestionsActionAtom={
              updateAndRefreshLocationSuggestionsActionAtom
            }
            locationAtom={locationAtom}
            locationStateAtom={locationStateAtom}
            updateLocationStatePaymentMethodAtom={
              updateLocationStatePaymentMethodAtom
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
        title: t('offerForm.paymentMethod.paymentMethod'),
        image: paymentMethodSvg,
        children: (
          <PaymentMethod
            locationStateAtom={locationStateAtom}
            paymentMethodAtom={paymentMethodAtom}
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
        title: t('offerForm.description.description'),
        image: descriptionSvg,
        children: <Description offerDescriptionAtom={offerDescriptionAtom} />,
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
      currencyAtom,
      updateCurrencyLimitsAtom,
      amountTopLimitAtom,
      amountBottomLimitAtom,
      offerTypeOrDummyValueAtom,
      feeAmountAtom,
      feeStateAtom,
      expirationDateAtom,
      offerExpirationModalVisibleAtom,
      setOfferLocationActionAtom,
      locationSuggestionsAtom,
      locationSuggestionsAtomsAtom,
      updateAndRefreshLocationSuggestionsActionAtom,
      locationAtom,
      locationStateAtom,
      updateLocationStatePaymentMethodAtom,
      tokens.color.white.val,
      createIsThisLanguageSelectedAtom,
      spokenLanguagesAtomsAtom,
      removeSpokenLanguageActionAtom,
      resetSelectedSpokenLanguagesActionAtom,
      saveSelectedSpokenLanguagesActionAtom,
      paymentMethodAtom,
      btcNetworkAtom,
      offerDescriptionAtom,
      intendedConnectionLevelAtom,
    ]
  )
}
