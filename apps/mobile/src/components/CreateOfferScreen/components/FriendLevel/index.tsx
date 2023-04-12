import {XStack} from 'tamagui'
import FriendLevelCell from './components/FriendLevelCell'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import firstDegreeFriendsSvg from './images/firstDegreeFriendsSvg'
import secondDegreeFriendsSvg from './images/secondDegreeFriendsSvg'
import {useAtom, useAtomValue} from 'jotai'
import {
  connectionLevelAtom,
  secondDegreeFriendsCountAtom,
} from '../../state/atom'
import {useContactsToDisplay} from '../../../ContactListSelect/state/contactsToDisplay'

function FriendLevel(): JSX.Element {
  const {t} = useTranslation()
  const [connectionLevel, setConnectionLevel] = useAtom(connectionLevelAtom)
  const firstDegreeFriends = useContactsToDisplay()
  const secondDegreeFriendsCount = useAtomValue(secondDegreeFriendsCountAtom)

  return (
    <XStack jc="space-evenly">
      <FriendLevelCell
        image={firstDegreeFriendsSvg}
        selected={connectionLevel === 'FIRST'}
        type="FIRST"
        onPress={setConnectionLevel}
        title={t('createOffer.friendLevel.firstDegree')}
        subtitle={t('createOffer.friendLevel.reachVexlers', {
          count: firstDegreeFriends.length,
        })}
      />
      <FriendLevelCell
        image={secondDegreeFriendsSvg}
        selected={connectionLevel === 'SECOND'}
        type="SECOND"
        onPress={setConnectionLevel}
        title={t('createOffer.friendLevel.secondDegree')}
        subtitle={t('createOffer.friendLevel.reachVexlers', {
          count: secondDegreeFriendsCount,
        })}
      />
    </XStack>
  )
}

export default FriendLevel
