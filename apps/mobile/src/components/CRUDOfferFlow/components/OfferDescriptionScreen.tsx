import {useMolecule} from 'bunshi/dist/react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Description from '../../OfferForm/components/Description'
import Expiration from '../../OfferForm/components/Expiration'
import Section from '../../Section'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import descriptionSvg from '../images/descriptionSvg'
import ScreenWrapper from './ScreenWrapper'

function OfferDescriptionScreen(): JSX.Element {
  const {t} = useTranslation()
  const {
    offerDescriptionAtom,
    listingTypeAtom,
    offerTypeAtom,
    expirationDateAtom,
    offerExpirationModalVisibleAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper testID="offer-description-screen">
      <Section
        title={t('offerForm.description.description')}
        image={descriptionSvg}
      >
        <Description
          offerDescriptionAtom={offerDescriptionAtom}
          listingTypeAtom={listingTypeAtom}
          offerTypeAtom={offerTypeAtom}
        />
      </Section>
      <Expiration
        expirationDateAtom={expirationDateAtom}
        offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
      />
    </ScreenWrapper>
  )
}

export default OfferDescriptionScreen
