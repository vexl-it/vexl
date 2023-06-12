import {XStack} from 'tamagui'
import FriendLevelCell from './components/FriendLevelCell'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import {type Atom, useAtom, useAtomValue} from 'jotai'
import {type IntendedConnectionLevel} from '@vexl-next/domain/dist/general/offers'
import {atom} from 'jotai'
import numberOfFriendsAtom from '../../../ModifyOffer/atoms/numberOfFriendsAtom'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import {Alert} from 'react-native'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'
import firstDegreeFriendsSvg from '../../../images/firstDegreeFriendsSvg'
import secondDegreeFriendsSvg from '../../../images/secondDegreeFriendsSvg'

const friendLevelSubtitleAtom = atom((get) => {
  const {t} = get(translationAtom)
  const numberOfFriends = get(numberOfFriendsAtom)
  return pipe(
    numberOfFriends,
    E.match(
      (e) => {
        if (e._tag !== 'friendsNotLoaded') {
          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
        }
        return {
          firstFriendLevelText: t('offerForm.friendLevel.noVexlers'),
          secondFriendLevelText: t('offerForm.friendLevel.noVexlers'),
        }
      },
      (r) => {
        return {
          firstFriendLevelText: t('offerForm.friendLevel.reachVexlers', {
            count: r.firstLevelFriendsCount,
          }),
          secondFriendLevelText: t('offerForm.friendLevel.reachVexlers', {
            count: r.secondLevelFriendsCount,
          }),
        }
      }
    )
  )
})

interface Props {
  intendedConnectionLevelAtom: Atom<IntendedConnectionLevel | undefined>
}

function FriendLevel({intendedConnectionLevelAtom}: Props): JSX.Element {
  const {t} = useTranslation()
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
        title={t('offerForm.friendLevel.firstDegree')}
        subtitle={subtitle.firstFriendLevelText}
      />
      <FriendLevelCell
        image={secondDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'ALL'}
        type="ALL"
        onPress={setIntendedConnectionLevel}
        title={t('offerForm.friendLevel.secondDegree')}
        subtitle={subtitle.secondFriendLevelText}
      />
    </XStack>
  )
}

export default FriendLevel
