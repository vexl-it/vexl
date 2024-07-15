import {useMolecule} from 'bunshi/dist/react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import FriendLevel from '../../OfferForm/components/FriendLevel'
import Section from '../../Section'
import friendLevelSvg from '../../images/friendLevelSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import ScreenWrapper from './ScreenWrapper'

function FriendLevelScreen(): JSX.Element {
  const {t} = useTranslation()
  const {intendedConnectionLevelAtom} = useMolecule(offerFormMolecule)

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
    </ScreenWrapper>
  )
}

export default FriendLevelScreen
