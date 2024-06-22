import {useMolecule} from 'bunshi/dist/react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import DeliveryMethod from '../../OfferForm/components/DeliveryMethod'
import Section from '../../Section'
import deliveryMethodSvg from '../../images/deliveryMethodSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function DeliveryMethodScreen(): JSX.Element {
  const {t} = useTranslation()
  const {
    locationAtom,
    locationStateAtom,
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
    </ScreenWrapper>
  )
}

export default DeliveryMethodScreen
