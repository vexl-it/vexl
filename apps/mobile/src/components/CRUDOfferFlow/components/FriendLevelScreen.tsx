import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {type CRUDOfferStackScreenProps} from '../../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ClubsComponent from '../../OfferForm/components/Clubs'
import FriendLevel from '../../OfferForm/components/FriendLevel'
import Section from '../../Section'
import friendLevelSvg from '../../images/friendLevelSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import clubsSvg from '../images/clubsSvg'
import ScreenWrapper from './ScreenWrapper'

type Props = CRUDOfferStackScreenProps<'FriendLevelScreen'>

function FriendLevelScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const {intendedConnectionLevelAtom, createSelectClubAtom} =
    useMolecule(offerFormMolecule)
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  return (
    <ScreenWrapper>
      <Section
        title={t('offerForm.friendLevel.friendLevel')}
        image={friendLevelSvg}
      >
        <FriendLevel
          intendedConnectionLevelAtom={intendedConnectionLevelAtom}
        />
      </Section>
      {clubsWithMembersAtoms.length > 0 && (
        <Section title={t('clubs.vexlClubs')} image={clubsSvg}>
          <ClubsComponent
            displayFaqsLink
            createSelectClubAtom={createSelectClubAtom}
            navigation={navigation}
          />
        </Section>
      )}
    </ScreenWrapper>
  )
}

export default FriendLevelScreen
