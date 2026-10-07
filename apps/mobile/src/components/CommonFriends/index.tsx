import {useNavigation} from '@react-navigation/native'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {
  CommonFriends as CommonFriendsUI,
  type CommonFriend,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {
  type CommonFriendsClub,
  type RootStackScreenProps,
} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {type OtherPersonRole} from '../../utils/otherPersonRole'
import {
  trustedFriendsCountText,
  trustedFriendsLine,
} from '../../utils/trustedFriendsText'
import {showTrustedFriendsExplanationOnceActionAtom} from '../TrustedFriends/atoms'
import useCommonFriendsChips from './useCommonFriendsChips'
import useCommonFriendsContacts from './useCommonFriendsContacts'

interface Props {
  commonConnectionsHashes: readonly HashedPhoneNumber[]
  verifiedConnectionsHashes: readonly HashedPhoneNumber[]
  otherSideClubs: ClubInfo[]
  // Optional override for the card label. Falls back to the offer wording.
  label?: string
  role: OtherPersonRole
  explainTrustedFriendsOnce?: boolean
}

function trimClubName(name: string): string {
  return name.length > 25 ? `${name.slice(0, 25)}...` : name
}

function CommonFriends({
  commonConnectionsHashes,
  verifiedConnectionsHashes,
  otherSideClubs,
  label,
  role,
  explainTrustedFriendsOnce,
}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const navigation =
    useNavigation<RootStackScreenProps<'CommonFriends'>['navigation']>()
  const showExplanationOnce = useSetAtom(
    showTrustedFriendsExplanationOnceActionAtom
  )
  const {trustedFriends, otherCommonFriends} = useCommonFriendsContacts(
    commonConnectionsHashes,
    verifiedConnectionsHashes
  )
  const firstTrustedFriend = trustedFriends[0]

  useEffect(() => {
    if (explainTrustedFriendsOnce && firstTrustedFriend) {
      showExplanationOnce({friend: firstTrustedFriend, role})
    }
  }, [explainTrustedFriendsOnce, firstTrustedFriend, role, showExplanationOnce])

  const commonFriendsCount = commonConnectionsHashes.length
  const clubsCount = otherSideClubs.length

  const commonFriendsClubs: readonly CommonFriendsClub[] = useMemo(
    () =>
      pipe(
        otherSideClubs,
        Array.map((club) => ({
          uuid: club.uuid,
          name: club.name,
          clubImageUrl: club.clubImageUrl,
        }))
      ),
    [otherSideClubs]
  )

  const sortedCommonFriends = useMemo(
    () => Array.appendAll(trustedFriends, otherCommonFriends),
    [trustedFriends, otherCommonFriends]
  )

  const visibleFriendsInPreview = useMemo(
    () => Array.take(sortedCommonFriends, 5),
    [sortedCommonFriends]
  )

  const friendChips = useCommonFriendsChips(
    visibleFriendsInPreview,
    verifiedConnectionsHashes
  )

  const handlePress = useCallback(() => {
    navigation.navigate('CommonFriends', {
      contactsHashes: commonConnectionsHashes,
      verifiedHashes: verifiedConnectionsHashes,
      clubs: commonFriendsClubs,
      role,
    })
  }, [
    commonConnectionsHashes,
    commonFriendsClubs,
    navigation,
    role,
    verifiedConnectionsHashes,
  ])

  const clubChips: readonly CommonFriend[] = useMemo(
    () =>
      pipe(
        commonFriendsClubs,
        Array.map((club) => ({
          id: club.uuid,
          name: trimClubName(club.name),
          avatarSource: {uri: club.clubImageUrl},
        }))
      ),
    [commonFriendsClubs]
  )

  const friends: readonly CommonFriend[] = useMemo(
    () => Array.appendAll(friendChips, clubChips),
    [clubChips, friendChips]
  )

  if (commonFriendsCount === 0 && clubsCount === 0) return null

  return (
    <CommonFriendsUI
      label={
        label ??
        (clubsCount > 0
          ? t('offer.numberOfCommonAndClubs', {
              number: formatInteger(commonFriendsCount, locale),
              clubs: formatInteger(clubsCount, locale),
            })
          : t('offer.numberOfCommon', {
              number: formatInteger(commonFriendsCount, locale),
            }))
      }
      trustedLabel={trustedFriendsCountText(trustedFriends.length, t)}
      trustedFriendsText={trustedFriendsLine({
        names: Array.map(trustedFriends, (friend) => friend.info.name),
        role,
        t,
      })}
      friends={friends}
      onPress={handlePress}
    />
  )
}

export default CommonFriends
