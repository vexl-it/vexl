import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, pipe} from 'effect'
import {useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {type CommonFriendsClub} from '../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type OtherPersonRole} from '../../utils/otherPersonRole'
import {
  otherCommonFriendsDescription,
  trustedFriendsDescription,
} from '../../utils/trustedFriendsText'
import {showTrustedFriendsExplanationActionAtom} from '../TrustedFriends/atoms'
import useCommonFriendsContacts from './useCommonFriendsContacts'

export type ListItem =
  | {
      readonly type: 'friend'
      readonly friend: StoredContactWithComputedValues
      readonly trusted?: boolean
    }
  | {
      readonly type: 'club'
      readonly club: CommonFriendsClub
    }
  | {
      readonly type: 'section'
      readonly title: string
      readonly caption?: string
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
  caption?: string,
  onInfoPress?: () => void
): ListItem {
  return {
    type: 'section',
    title,
    caption,
    onInfoPress,
  }
}

export default function useCommonFriendsListData({
  contactsHashes,
  verifiedHashes,
  clubs,
  role,
}: {
  readonly contactsHashes: readonly HashedPhoneNumber[]
  readonly verifiedHashes: readonly HashedPhoneNumber[]
  readonly clubs: readonly CommonFriendsClub[]
  readonly role: OtherPersonRole
}): readonly ListItem[] {
  const {t} = useTranslation()
  const {trustedFriends, otherCommonFriends} = useCommonFriendsContacts(
    contactsHashes,
    verifiedHashes
  )
  const showExplanation = useSetAtom(showTrustedFriendsExplanationActionAtom)

  return useMemo(() => {
    const clubItems = pipe(clubs, Array.map(createClubListItem))
    const clubSection = Array.isNonEmptyArray(clubItems)
      ? Array.prepend(
          clubItems,
          createSectionListItem(t('commonFriends.clubs'))
        )
      : []
    const commonItems = Array.map(otherCommonFriends, (friend) =>
      createFriendListItem(friend)
    )

    if (!Array.isNonEmptyArray(trustedFriends)) {
      return Array.appendAll(commonItems, clubSection)
    }

    const firstTrustedFriend = trustedFriends[0]
    const trustedSection = Array.prepend(
      Array.map(trustedFriends, (friend) => createFriendListItem(friend, true)),
      createSectionListItem(
        t('commonFriends.trustedFriends'),
        trustedFriendsDescription(role, t),
        () => {
          showExplanation({friend: firstTrustedFriend, role})
        }
      )
    )
    const commonSection = Array.isNonEmptyArray(commonItems)
      ? Array.prepend(
          commonItems,
          createSectionListItem(
            t('commonFriends.otherCommonFriends'),
            otherCommonFriendsDescription(role, t)
          )
        )
      : []

    return pipe(
      trustedSection,
      Array.appendAll(commonSection),
      Array.appendAll(clubSection)
    )
  }, [clubs, trustedFriends, otherCommonFriends, role, showExplanation, t])
}
