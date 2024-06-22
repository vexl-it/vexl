import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ListingType from '../../OfferForm/components/ListingType'
import OfferType from '../../OfferForm/components/OfferType'
import Section from '../../Section'
import listingTypeSvg from '../../images/listingTypeSvg'
import userSvg from '../../images/userSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function ListingAndOfferTypeScreen(): JSX.Element {
  const {t} = useTranslation()
  const {listingTypeAtom, offerTypeAtom, updateListingTypeActionAtom} =
    useMolecule(offerFormMolecule)

  const listingType = useAtomValue(listingTypeAtom)

  return (
    <ScreenWrapper>
      <Section title={t('offerForm.listingType')} image={listingTypeSvg}>
        <ListingType
          listingTypeAtom={listingTypeAtom}
          updateListingTypeActionAtom={updateListingTypeActionAtom}
        />
      </Section>
      {!!listingType && (
        <Section title={t('offerForm.iWantTo')} image={userSvg}>
          <OfferType
            listingTypeAtom={listingTypeAtom}
            offerTypeAtom={offerTypeAtom}
          />
        </Section>
      )}
    </ScreenWrapper>
  )
}

export default ListingAndOfferTypeScreen
