import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {FriendLevel as UIFriendLevel} from '@vexl-next/ui'
import {atom, useAtom, useAtomValue, type WritableAtom} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import numberOfFriendsAtom from '../../../CRUDOfferFlow/atoms/numberOfFriendsAtom'
import {showErrorAlert} from '../../../ErrorAlert'

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
  intendedConnectionLevelAtom: WritableAtom<
    IntendedConnectionLevel | undefined,
    [IntendedConnectionLevel],
    void
  >
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
    <XStack flexWrap="wrap" justifyContent="center" gap="$3">
      <UIFriendLevel
        degree="FIRST"
        loading={numberOfFriends.state === 'loading'}
        selected={intendedConnectionLevel === 'FIRST'}
        onPress={() => {
          setIntendedConnectionLevel('FIRST')
        }}
        title={t('offerForm.friendLevel.firstDegree')}
        subtitle={
          customSubtitles?.first ??
          (!hideSubtitle ? subtitle.firstFriendLevelText : undefined)
        }
      />
      <UIFriendLevel
        degree="ALL"
        loading={numberOfFriends.state === 'loading'}
        selected={intendedConnectionLevel === 'ALL'}
        onPress={() => {
          setIntendedConnectionLevel('ALL')
        }}
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
