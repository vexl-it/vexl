import {useMolecule} from 'bunshi/dist/react'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import DeliveryMethod from '../../OfferForm/components/DeliveryMethod'
import Network from '../../OfferForm/components/Network'
import Section from '../../Section'
import deliveryMethodSvg from '../../images/deliveryMethodSvg'
import networkSvg from '../../images/networkSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function DeliveryMethodAndNetworkScreen(): React.ReactElement {
  const {t} = useTranslation()
  const {
    locationAtom,
    locationStateAtom,
    updateBtcNetworkAtom,
    updateLocationStateAndPaymentMethodAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper>
      <Section title={t('offerForm.deliveryMethod')} image={deliveryMethodSvg}>
        <DeliveryMethod
          randomizeLocation
          locationAtom={locationAtom}
          locationStateAtom={locationStateAtom}
          updateLocationStateAndPaymentMethodAtom={
            updateLocationStateAndPaymentMethodAtom
          }
        />
      </Section>
      <Section title={t('offerForm.network.network')} image={networkSvg}>
        <Network btcNetworkAtom={updateBtcNetworkAtom} />
      </Section>
    </ScreenWrapper>
  )
}

export default DeliveryMethodAndNetworkScreen
