import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {atom, useAtom, useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import numberOfFriendsAtom from '../../../CRUDOfferFlow/atoms/numberOfFriendsAtom'
import {showErrorAlert} from '../../../ErrorAlert'
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
      title: t('common.somethingWentWrong'),
      description: t('common.somethingWentWrongDescription'),
      error: e,
    })

    return {
      firstFriendLevelText: t('offerForm.friendLevel.noPeople'),
      secondFriendLevelText: t('offerForm.friendLevel.noPeople'),
    }
  }

  return {
    firstFriendLevelText: t('offerForm.friendLevel.reachPeople', {
      count: numberOfFriends.firstLevelFriendsCount,
    }),
    secondFriendLevelText: t('offerForm.friendLevel.reachPeople', {
      count: numberOfFriends.firstAndSecondLevelFriendsCount,
    }),
  }
})

interface Props {
  hideSubtitle?: boolean
  subtitles?: {first: string; second: string}
  intendedConnectionLevelAtom: Atom<IntendedConnectionLevel | undefined>
}

function FriendLevel({
  hideSubtitle,
  subtitles: customSubtitles,
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
        subtitle={
          customSubtitles?.first ??
          (!hideSubtitle ? subtitle.firstFriendLevelText : undefined)
        }
      />
      <FriendLevelCell
        loading={numberOfFriends.state === 'loading'}
        image={secondDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'ALL'}
        type="ALL"
        onPress={setIntendedConnectionLevel}
        title={t('offerForm.friendLevel.secondDegree')}
        subtitle={
          customSubtitles?.second ??
          (!hideSubtitle ? subtitle.secondFriendLevelText : undefined)
        }
      />
    </XStack>
  )
}

export default FriendLevel
