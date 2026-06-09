import {FlashList} from '@shopify/flash-list'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  EditRow,
  Image,
  NavigationBar,
  Screen,
  Typography,
  UserImagePlaceholder,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Array, pipe} from 'effect'
import {useAtomValue, useStore} from 'jotai'
import React, {memo, useCallback, useMemo} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {
  type CommonFriendsClub,
  type RootStackScreenProps,
} from '../../navigationTypes'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import useSafeGoBack from '../../utils/useSafeGoBack'
import ContactPictureImage from '../ContactPictureImage'

function FriendListItem({
  friend,
}: {
  readonly friend: StoredContactWithComputedValues
}): React.ReactElement {
  const internationalNumber = parsePhoneNumber(
    friend.computedValues.normalizedNumber
  ).number?.international

  return (
    <EditRow
      state="profile"
      headline={friend.info.name}
      overline={internationalNumber ?? friend.computedValues.normalizedNumber}
      showEditButton={false}
      avatar={{
        children: (
          <ContactPictureImage
            width={40}
            height={40}
            objectFit="cover"
            contactId={friend.info.nonUniqueContactId}
            fallback={<UserImagePlaceholder size={40} />}
          />
        ),
      }}
    />
  )
}

const MemoizedFriendListItem = memo(FriendListItem)

function ClubListItem({
  club,
}: {
  readonly club: CommonFriendsClub
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <EditRow
      state="profile"
      headline={club.name}
      overline={t('commonFriends.club')}
      showEditButton={false}
      avatar={{
        children: (
          <Stack
            width={40}
            height={40}
            borderRadius="$3"
            overflow="hidden"
            backgroundColor="$accentYellowSecondary"
          >
            <Image
              source={{uri: club.clubImageUrl}}
              width="100%"
              height="100%"
              objectFit="cover"
            />
          </Stack>
        ),
      }}
    />
  )
}

const MemoizedClubListItem = memo(ClubListItem)

type ListItem =
  | {
      readonly type: 'friend'
      readonly friend: StoredContactWithComputedValues
    }
  | {
      readonly type: 'club'
      readonly club: CommonFriendsClub
    }
  | {
      readonly type: 'section'
      readonly title: string
    }

function createFriendListItem(
  friend: StoredContactWithComputedValues
): ListItem {
  return {
    type: 'friend',
    friend,
  }
}

function createClubListItem(club: CommonFriendsClub): ListItem {
  return {
    type: 'club',
    club,
  }
}

function createSectionListItem(title: string): ListItem {
  return {
    type: 'section',
    title,
  }
}

function ItemSeparator(): React.ReactElement {
  return <Stack height={8} />
}

function keyExtractor(item: ListItem): string {
  if (item.type === 'friend') return item.friend.computedValues.hash
  if (item.type === 'club') return item.club.uuid
  return `section-${item.title}`
}

function ListHeader({
  hasCommonFriends,
}: {
  readonly hasCommonFriends: boolean
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Typography
      variant="description"
      color="$foregroundPrimary"
      marginBottom="$5"
    >
      {hasCommonFriends
        ? `${t('offer.youSeeThisOfferBecause')} ${t('offer.dontForgetToVerifyTheIdentity')}`
        : t('offer.youSeeThisClubOfferBecause')}
    </Typography>
  )
}

function useCommonFriendsListData({
  contactsHashes,
  verifiedHashes,
  clubs,
}: {
  readonly contactsHashes: readonly HashedPhoneNumber[]
  readonly verifiedHashes?: readonly HashedPhoneNumber[]
  readonly clubs: readonly CommonFriendsClub[]
}): readonly ListItem[] {
  const {t} = useTranslation()
  const store = useStore()
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)

  const commonFriends = useMemo(
    () => store.get(createImportedContactsForHashesAtom(contactsHashes)),
    [contactsHashes, store]
  )

  const verifiedHashesSet = useMemo(
    () =>
      showVerifiedContacts
        ? new Set(verifiedHashes ?? [])
        : new Set<HashedPhoneNumber>(),
    [showVerifiedContacts, verifiedHashes]
  )

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
        pipe(commonFriends, Array.map(createFriendListItem)),
        clubSection
      )
    }

    const verifiedFriends = pipe(
      commonFriends,
      Array.filter((friend) =>
        verifiedHashesSet.has(friend.computedValues.hash)
      )
    )
    const commonFriendsWithoutVerified = pipe(
      commonFriends,
      Array.filter(
        (friend) => !verifiedHashesSet.has(friend.computedValues.hash)
      )
    )

    const verifiedItems = pipe(verifiedFriends, Array.map(createFriendListItem))
    const commonItems = pipe(
      commonFriendsWithoutVerified,
      Array.map(createFriendListItem)
    )

    const verifiedSection = Array.isNonEmptyArray(verifiedItems)
      ? Array.appendAll(
          [createSectionListItem(t('commonFriends.verifiedFriends'))],
          verifiedItems
        )
      : []
    const commonSection = Array.isNonEmptyArray(commonItems)
      ? Array.appendAll(
          [createSectionListItem(t('commonFriends.commonFriends'))],
          commonItems
        )
      : []

    return pipe(
      verifiedSection,
      Array.appendAll(commonSection),
      Array.appendAll(clubSection)
    )
  }, [clubs, commonFriends, showVerifiedContacts, t, verifiedHashesSet])
}

type Props = RootStackScreenProps<'CommonFriends'>

function CommonFriendsScreen({
  route: {
    params: {contactsHashes, verifiedHashes, clubs},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {bottom} = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack()
  const data = useCommonFriendsListData({contactsHashes, verifiedHashes, clubs})
  const hasCommonFriends = contactsHashes.length > 0

  const renderItem = useCallback(({item}: {item: ListItem}) => {
    if (item.type === 'friend') {
      return <MemoizedFriendListItem friend={item.friend} />
    }

    if (item.type === 'club') {
      return <MemoizedClubListItem club={item.club} />
    }

    return (
      <Typography
        variant="descriptionBold"
        color="$foregroundSecondary"
        marginTop="$2"
      >
        {item.title}
      </Typography>
    )
  }, [])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('commonFriends.commonFriends')}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<ListHeader hasCommonFriends={hasCommonFriends} />}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: bottom}}
      />
    </Screen>
  )
}

export default CommonFriendsScreen
