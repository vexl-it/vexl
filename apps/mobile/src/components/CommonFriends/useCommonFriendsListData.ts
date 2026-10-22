import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {
  type CommonFriendsClub,
  type RootStackScreenProps,
} from '../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import {showTrustedFriendExplanationActionAtom} from './atoms'
import {useCommonFriends} from './useCommonFriends'

export type ListItem =
  | {
      readonly type: 'friend'
      readonly trusted: boolean
      readonly friend: StoredContactWithComputedValues
    }
  | {
      readonly type: 'club'
      readonly club: CommonFriendsClub
    }
  | {
      readonly type: 'section'
      readonly title: string
      readonly onInfoPress?: () => void
    }

function createFriendListItem(
  friend: StoredContactWithComputedValues,
  trusted = false
): ListItem {
  return {
    type: 'friend',
    friend,
    trusted,
  }
}

function createClubListItem(club: CommonFriendsClub): ListItem {
  return {
    type: 'club',
    club,
  }
}

function createSectionListItem(
  title: string,
  onInfoPress?: () => void
): ListItem {
  return {
    type: 'section',
    title,
    onInfoPress,
  }
}

export function useCommonFriendsListData({
  contactsHashes,
  verifiedHashes,
  clubs,
  otherSide,
}: {
  readonly contactsHashes: readonly HashedPhoneNumber[]
  readonly verifiedHashes?: readonly HashedPhoneNumber[]
  readonly clubs: readonly CommonFriendsClub[]
  readonly otherSide: RootStackScreenProps<'CommonFriends'>['route']['params']['otherSide']
}): readonly ListItem[] {
  const {t} = useTranslation()
  const showExplanation = useSetAtom(showTrustedFriendExplanationActionAtom)
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)

  const {
    trustedFriends: verifiedFriends,
    otherCommonFriends: commonFriendsWithoutVerified,
    sortedFriends: commonFriends,
  } = useCommonFriends(contactsHashes, verifiedHashes)

  return useMemo((): readonly ListItem[] => {
    const clubItems = pipe(clubs, Array.map(createClubListItem))
    const clubSection = Array.isNonEmptyArray(clubItems)
      ? Array.appendAll(
          [createSectionListItem(t('commonFriends.clubs'))],
          clubItems
        )
      : []

    if (!showVerifiedContacts) {
      return Array.appendAll(
        pipe(
          commonFriends,
          Array.map((friend) => createFriendListItem(friend))
        ),
        clubSection
      )
    }

    const verifiedItems = pipe(
      verifiedFriends,
      Array.map((friend) => createFriendListItem(friend, true))
    )
    const commonItems = pipe(
      commonFriendsWithoutVerified,
      Array.map((friend) => createFriendListItem(friend))
    )

    const verifiedSection = Array.isNonEmptyArray(verifiedItems)
      ? Array.appendAll(
          [
            createSectionListItem(t('commonFriends.trustedFriends'), () => {
              const friend = verifiedFriends[0]
              if (friend) showExplanation({friend, otherSide})
            }),
          ],
          verifiedItems
        )
      : []
    const commonSection = Array.isNonEmptyArray(commonItems)
      ? Array.appendAll(
          [
            createSectionListItem(
              t(
                Array.isNonEmptyArray(verifiedItems)
                  ? 'commonFriends.otherCommonFriends'
                  : 'commonFriends.commonFriends'
              )
            ),
          ],
          commonItems
        )
      : []

    return pipe(
      verifiedSection,
      Array.appendAll(commonSection),
      Array.appendAll(clubSection)
    )
  }, [
    clubs,
    commonFriends,
    showVerifiedContacts,
    t,
    verifiedFriends,
    commonFriendsWithoutVerified,
    showExplanation,
    otherSide,
  ])
}
