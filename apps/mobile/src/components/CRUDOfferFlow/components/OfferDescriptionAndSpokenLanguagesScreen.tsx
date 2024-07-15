import {useMolecule} from 'bunshi/dist/react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Description from '../../OfferForm/components/Description'
import SpokenLanguages from '../../OfferForm/components/SpokenLanguages'
import Section from '../../Section'
import spokenLanguagesSvg from '../../images/spokenLanguagesSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import descriptionSvg from '../images/descriptionSvg'
import ScreenWrapper from './ScreenWrapper'

function OfferDescriptionAndSpokenLanguagesScreen(): JSX.Element {
  const {t} = useTranslation()
  const {
    offerDescriptionAtom,
    listingTypeAtom,
    offerTypeAtom,
    createIsThisLanguageSelectedAtom,
    spokenLanguagesAtomsAtom,
    removeSpokenLanguageActionAtom,
    resetSelectedSpokenLanguagesActionAtom,
    saveSelectedSpokenLanguagesActionAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper>
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
      <Section
        title={t('offerForm.spokenLanguages.language')}
        image={spokenLanguagesSvg}
        imageFill={getTokens().color.white.val}
      >
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
      </Section>
    </ScreenWrapper>
  )
}

export default OfferDescriptionAndSpokenLanguagesScreen
