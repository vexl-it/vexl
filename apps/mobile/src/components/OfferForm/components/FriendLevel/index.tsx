import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {FriendLevel as UIFriendLevel} from '@vexl-next/ui'
import {atom, useAtom, useAtomValue, type WritableAtom} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../utils/localization/formattingLocaleAtom'
import numberOfFriendsAtom from '../../../CRUDOfferFlow/atoms/numberOfFriendsAtom'
import {showErrorAlert} from '../../../ErrorAlert'

const friendLevelSubtitleAtom = atom((get) => {
  const {t} = get(translationAtom)
  const locale = get(formattingLocaleAtom)
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
    firstFriendLevelText: t('offerForm.friendLevel.reachPeopleFormatted', {
      localizedString: formatInteger(
        numberOfFriends.firstLevelFriendsCount,
        locale
      ),
    }),
    secondFriendLevelText: t('offerForm.friendLevel.reachPeopleFormatted', {
      localizedString: formatInteger(
        numberOfFriends.firstAndSecondLevelFriendsCount,
        locale
      ),
    }),
  }
})

interface Props {
  hideSubtitle?: boolean
  allowDeselect?: boolean
  onDeselect?: () => void
  subtitles?: {first: string; second: string}
  intendedConnectionLevelAtom: WritableAtom<
    IntendedConnectionLevel | undefined,
    [IntendedConnectionLevel],
    void
  >
}

function FriendLevel({
  hideSubtitle,
  allowDeselect,
  onDeselect,
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
          if (
            allowDeselect &&
            intendedConnectionLevel === 'FIRST' &&
            onDeselect
          ) {
            onDeselect()
            return
          }

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
          if (
            allowDeselect &&
            intendedConnectionLevel === 'ALL' &&
            onDeselect
          ) {
            onDeselect()
            return
          }

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
