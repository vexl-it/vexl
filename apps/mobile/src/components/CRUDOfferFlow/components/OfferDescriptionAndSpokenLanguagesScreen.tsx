import {useMolecule} from 'bunshi/dist/react'
import React from 'react'
import {Platform} from 'react-native'
import Animated, {
  scrollTo,
  useAnimatedRef,
  useDerivedValue,
  type AnimatedRef,
} from 'react-native-reanimated'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useIsKeyboardShown from '../../../utils/useIsKeyboardShown'
import Description from '../../OfferForm/components/Description'
import SpokenLanguages from '../../OfferForm/components/SpokenLanguages'
import Section from '../../Section'
import spokenLanguagesSvg from '../../images/spokenLanguagesSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import descriptionSvg from '../images/descriptionSvg'

function OfferDescriptionAndSpokenLanguagesScreen(): React.ReactElement {
  const {t} = useTranslation()
  const animatedRef: AnimatedRef<Animated.ScrollView> = useAnimatedRef()
  const isKeyboardShown = useIsKeyboardShown()
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

  useDerivedValue(() => {
    if (isKeyboardShown && Platform.OS === 'ios')
      // Infinity is used to scroll to the bottom of the scroll view
      scrollTo(animatedRef, 0, Infinity, true)
  })

  return (
    <Animated.ScrollView
      style={{flex: 1, backgroundColor: getTokens().color.black.val}}
      ref={animatedRef}
      showsVerticalScrollIndicator={false}
    >
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
    </Animated.ScrollView>
  )
}

export default OfferDescriptionAndSpokenLanguagesScreen
