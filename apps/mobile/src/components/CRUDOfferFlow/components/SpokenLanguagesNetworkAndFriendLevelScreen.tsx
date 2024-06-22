import {useMolecule} from 'bunshi/dist/react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import FriendLevel from '../../OfferForm/components/FriendLevel'
import Network from '../../OfferForm/components/Network'
import SpokenLanguages from '../../OfferForm/components/SpokenLanguages'
import Section from '../../Section'
import friendLevelSvg from '../../images/friendLevelSvg'
import networkSvg from '../../images/networkSvg'
import spokenLanguagesSvg from '../../images/spokenLanguagesSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function SpokenLanguagesNetworkAndFriendLevelScreen(): JSX.Element {
  const {t} = useTranslation()
  const {
    updateBtcNetworkAtom,
    intendedConnectionLevelAtom,
    createIsThisLanguageSelectedAtom,
    spokenLanguagesAtomsAtom,
    removeSpokenLanguageActionAtom,
    resetSelectedSpokenLanguagesActionAtom,
    saveSelectedSpokenLanguagesActionAtom,
  } = useMolecule(offerFormMolecule)

  return (
    <ScreenWrapper>
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
      <Section title={t('offerForm.network.network')} image={networkSvg}>
        <Network btcNetworkAtom={updateBtcNetworkAtom} />
      </Section>
      <Section
        title={t('offerForm.friendLevel.friendLevel')}
        image={friendLevelSvg}
      >
        <FriendLevel
          intendedConnectionLevelAtom={intendedConnectionLevelAtom}
        />
      </Section>
    </ScreenWrapper>
  )
}

export default SpokenLanguagesNetworkAndFriendLevelScreen
