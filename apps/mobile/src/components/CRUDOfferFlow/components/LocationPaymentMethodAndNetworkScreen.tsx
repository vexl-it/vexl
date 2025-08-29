import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Location from '../../OfferForm/components/Location'
import Network from '../../OfferForm/components/Network'
import PaymentMethod from '../../OfferForm/components/PaymentMethod'
import Section from '../../Section'
import networkSvg from '../../images/networkSvg'
import paymentMethodSvg from '../../images/paymentMethod'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function LocationPaymentMethodAndNetworkScreen(): React.ReactElement {
  const {t} = useTranslation()
  const {
    updateBtcNetworkAtom,
    setOfferLocationActionAtom,
    locationAtom,
    locationStateAtom,
    toggleLocationActiveAtom,
    updateLocationStateAndPaymentMethodAtom,
    listingTypeAtom,
    paymentMethodAtom,
  } = useMolecule(offerFormMolecule)

  const listingType = useAtomValue(listingTypeAtom)

  return (
    <ScreenWrapper>
      <Location
        randomizeLocation
        listingTypeAtom={listingTypeAtom}
        setOfferLocationActionAtom={setOfferLocationActionAtom}
        locationAtom={locationAtom}
        locationStateAtom={locationStateAtom}
        toggleLocationActiveAtom={toggleLocationActiveAtom}
        updateLocationStateAndPaymentMethodAtom={
          updateLocationStateAndPaymentMethodAtom
        }
      />
      {listingType === 'BITCOIN' && (
        <Section
          title={t('offerForm.paymentMethod.paymentMethod')}
          image={paymentMethodSvg}
        >
          <PaymentMethod
            locationStateAtom={locationStateAtom}
            paymentMethodAtom={paymentMethodAtom}
          />
        </Section>
      )}
      <Section title={t('offerForm.network.network')} image={networkSvg}>
        <Network btcNetworkAtom={updateBtcNetworkAtom} />
      </Section>
    </ScreenWrapper>
  )
}

export default LocationPaymentMethodAndNetworkScreen
