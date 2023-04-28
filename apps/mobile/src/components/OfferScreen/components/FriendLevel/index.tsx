import {XStack} from 'tamagui'
import FriendLevelCell from './components/FriendLevelCell'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import firstDegreeFriendsSvg from './images/firstDegreeFriendsSvg'
import secondDegreeFriendsSvg from './images/secondDegreeFriendsSvg'
import {useAtom, useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../../atoms/offerFormStateAtoms'

function FriendLevel(): JSX.Element {
  const {t} = useTranslation()
  const {intendedConnectionLevelAtom, friendLevelSubtitleAtom} = useMolecule(
    offerFormStateMolecule
  )
  const [intendedConnectionLevel, setIntendedConnectionLevel] = useAtom(
    intendedConnectionLevelAtom
  )
  const subtitle = useAtomValue(friendLevelSubtitleAtom)

  return (
    <XStack jc="space-evenly">
      <FriendLevelCell
        image={firstDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'FIRST'}
        type="FIRST"
        onPress={setIntendedConnectionLevel}
        title={t('createOffer.friendLevel.firstDegree')}
        subtitle={subtitle.firstFriendLevelText}
      />
      <FriendLevelCell
        image={secondDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'ALL'}
        type="ALL"
        onPress={setIntendedConnectionLevel}
        title={t('createOffer.friendLevel.secondDegree')}
        subtitle={subtitle.secondFriendLevelText}
      />
    </XStack>
  )
}

export default FriendLevel
