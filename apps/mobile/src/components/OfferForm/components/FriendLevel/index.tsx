import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {atom, useAtom, useAtomValue, type Atom} from 'jotai'
import {XStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'
import numberOfFriendsAtom from '../../../ModifyOffer/atoms/numberOfFriendsAtom'
import firstDegreeFriendsSvg from '../../../images/firstDegreeFriendsSvg'
import secondDegreeFriendsSvg from '../../../images/secondDegreeFriendsSvg'
import FriendLevelCell from './components/FriendLevelCell'

const friendLevelSubtitleAtom = atom((get) => {
  const {t} = get(translationAtom)
  const numberOfFriends = get(numberOfFriendsAtom)
  return pipe(
    numberOfFriends,
    E.match(
      (e) => {
        if (e._tag !== 'friendsNotLoaded') {
          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
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
  hideSubtitle?: boolean
  intendedConnectionLevelAtom: Atom<IntendedConnectionLevel | undefined>
}

function FriendLevel({
  hideSubtitle,
  intendedConnectionLevelAtom,
}: Props): JSX.Element {
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
        subtitle={!hideSubtitle ? subtitle.firstFriendLevelText : undefined}
      />
      <FriendLevelCell
        image={secondDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'ALL'}
        type="ALL"
        onPress={setIntendedConnectionLevel}
        title={t('offerForm.friendLevel.secondDegree')}
        subtitle={!hideSubtitle ? subtitle.secondFriendLevelText : undefined}
      />
    </XStack>
  )
}

export default FriendLevel
