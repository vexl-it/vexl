import {useMolecule} from 'bunshi/dist/react'
import {useMemo} from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Description from '../OfferForm/components/Description'
import Expiration from '../OfferForm/components/Expiration'
import FriendLevel from '../OfferForm/components/FriendLevel'
import Location from '../OfferForm/components/Location'
import Network from '../OfferForm/components/Network'
import SpokenLanguages from '../OfferForm/components/SpokenLanguages'
import {type Props} from '../Section'
import friendLevelSvg from '../images/friendLevelSvg'
import locationSvg from '../images/locationSvg'
import networkSvg from '../images/networkSvg'
import spokenLanguagesSvg from '../images/spokenLanguagesSvg'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import descriptionSvg from './images/descriptionSvg'

export default function useProductOfferContent(): Props[] {
  const {t} = useTranslation()
  const tokens = getTokens()
  const {
    btcNetworkAtom,
    offerTypeAtom,
    listingTypeAtom,
    offerDescriptionAtom,
    intendedConnectionLevelAtom,
    locationAtom,
    locationStateAtom,
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
    updateLocationStatePaymentMethodAtom,
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
          <Expiration
            key={t('offerForm.expiration.expiration')}
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
            randomizeLocation
            setOfferLocationActionAtom={setOfferLocationActionAtom}
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
      offerDescriptionAtom,
      listingTypeAtom,
      offerTypeAtom,
      t,
      expirationDateAtom,
      offerExpirationModalVisibleAtom,
      setOfferLocationActionAtom,
      locationAtom,
      locationStateAtom,
      updateLocationStatePaymentMethodAtom,
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
