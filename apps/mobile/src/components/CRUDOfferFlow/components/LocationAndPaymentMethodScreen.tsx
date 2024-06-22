import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Location from '../../OfferForm/components/Location'
import PaymentMethod from '../../OfferForm/components/PaymentMethod'
import Section from '../../Section'
import paymentMethodSvg from '../../images/paymentMethod'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function LocationAndPaymentMethodScreen(): JSX.Element {
  const {t} = useTranslation()
  const {
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
    </ScreenWrapper>
  )
}

export default LocationAndPaymentMethodScreen
