import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {atom, useAtom, useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../../utils/showErrorAlert'
import numberOfFriendsAtom from '../../../CRUDOfferFlow/atoms/numberOfFriendsAtom'
import firstDegreeFriendsSvg from '../../../images/firstDegreeFriendsSvg'
import secondDegreeFriendsSvg from '../../../images/secondDegreeFriendsSvg'
import FriendLevelCell from './components/FriendLevelCell'

const friendLevelSubtitleAtom = atom((get) => {
  const {t} = get(translationAtom)
  const numberOfFriends = get(numberOfFriendsAtom)

  if (numberOfFriends.state === 'loading')
    return {
      firstFriendLevelText: t('common.loading'),
      secondFriendLevelText: t('common.loading'),
    }

  if (numberOfFriends.state === 'error') {
    const e = numberOfFriends.error
    showErrorAlert({
      title: t('common.unknownError'),
      error: e,
    })

    return {
      firstFriendLevelText: t('offerForm.friendLevel.noVexlers'),
      secondFriendLevelText: t('offerForm.friendLevel.noVexlers'),
    }
  }

  return {
    firstFriendLevelText: t('offerForm.friendLevel.reachVexlers', {
      count: numberOfFriends.firstLevelFriendsCount,
    }),
    secondFriendLevelText: t('offerForm.friendLevel.reachVexlers', {
      count: numberOfFriends.firstAndSecondLevelFriendsCount,
    }),
  }
})

interface Props {
  hideSubtitle?: boolean
  intendedConnectionLevelAtom: Atom<IntendedConnectionLevel | undefined>
}

function FriendLevel({
  hideSubtitle,
  intendedConnectionLevelAtom,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [intendedConnectionLevel, setIntendedConnectionLevel] = useAtom(
    intendedConnectionLevelAtom
  )
  const subtitle = useAtomValue(friendLevelSubtitleAtom)
  const numberOfFriends = useAtomValue(numberOfFriendsAtom)

  return (
    <XStack jc="space-evenly">
      <FriendLevelCell
        loading={numberOfFriends.state === 'loading'}
        image={firstDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'FIRST'}
        type="FIRST"
        onPress={setIntendedConnectionLevel}
        title={t('offerForm.friendLevel.firstDegree')}
        subtitle={!hideSubtitle ? subtitle.firstFriendLevelText : undefined}
      />
      <FriendLevelCell
        loading={numberOfFriends.state === 'loading'}
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
