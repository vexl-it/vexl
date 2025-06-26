import {useMolecule} from 'bunshi/dist/react'
import {type CRUDOfferStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ClubsComponent from '../../OfferForm/components/Clubs'
import FriendLevel from '../../OfferForm/components/FriendLevel'
import Section from '../../Section'
import friendLevelSvg from '../../images/friendLevelSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

type Props = CRUDOfferStackScreenProps<'FriendLevelScreen'>

function FriendLevelScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const {intendedConnectionLevelAtom, createSelectClubAtom} =
    useMolecule(offerFormMolecule)

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
      <ClubsComponent
        form="OfferForm"
        createSelectClubAtom={createSelectClubAtom}
        navigation={navigation}
      />
    </ScreenWrapper>
  )
}

export default FriendLevelScreen
