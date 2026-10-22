import {FlashList} from '@shopify/flash-list'
import {type FriendLevel} from '@vexl-next/domain/src/general/offers'
import {
  EditRow,
  Image,
  InfoCircle,
  NavigationBar,
  Screen,
  Typography,
  UserImagePlaceholder,
  XStack,
  XmarkCancelClose,
  useTheme,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Array} from 'effect'
import React, {memo, useCallback} from 'react'
import {Pressable} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {
  type CommonFriendsClub,
  type RootStackScreenProps,
} from '../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import ContactPictureImage from '../ContactPictureImage'
import {
  useCommonFriendsListData,
  type ListItem,
} from './useCommonFriendsListData'

function FriendListItem({
  friend,
  trusted,
}: {
  readonly friend: StoredContactWithComputedValues
  readonly trusted: boolean
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
        trusted,
        trustBadgeRingColor: '$backgroundSecondary',
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

function ItemSeparator(): React.ReactElement {
  return <Stack height={8} />
}

function keyExtractor(item: ListItem): string {
  if (item.type === 'friend') return item.friend.computedValues.hash
  if (item.type === 'club') return item.club.uuid
  return `section-${item.title}`
}

function ListHeader({
  friendLevel,
  isMine,
  hasCommonFriends,
}: {
  readonly friendLevel: readonly FriendLevel[]
  readonly isMine: boolean
  readonly hasCommonFriends: boolean
}): React.ReactElement {
  const {t} = useTranslation()

  const text = (() => {
    if (Array.contains(friendLevel, 'FIRST_DEGREE')) {
      return `${t(
        isMine
          ? 'commonFriends.header.directFriendYouHaveTheirNumber'
          : 'commonFriends.header.directFriendTheyHaveYourNumber'
      )} ${t(
        hasCommonFriends
          ? 'offer.dontForgetToVerifyTheIdentity'
          : 'offer.beCautiousWeCannotVerify'
      )}`
    }
    if (Array.contains(friendLevel, 'SECOND_DEGREE') && hasCommonFriends) {
      return `${t('commonFriends.header.friendOfFriend')} ${t(
        'offer.dontForgetToVerifyTheIdentity'
      )}`
    }
    if (Array.contains(friendLevel, 'CLUB')) {
      return t('commonFriends.header.club')
    }
    return t('offer.beCautiousWeCannotVerify')
  })()

  return (
    <Typography
      variant="description"
      color="$foregroundPrimary"
      marginBottom="$5"
    >
      {text}
    </Typography>
  )
}

type Props = RootStackScreenProps<'CommonFriends'>

function CommonFriendsScreen({
  route: {
    params: {
      contactsHashes,
      verifiedHashes,
      clubs,
      friendLevel,
      isMine,
      otherSide,
    },
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const {bottom} = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack()
  const data = useCommonFriendsListData({
    contactsHashes,
    verifiedHashes,
    clubs,
    otherSide,
  })
  const hasCommonFriends = contactsHashes.length > 0

  const ListHeaderWithProps = useCallback(
    () => (
      <ListHeader
        friendLevel={friendLevel}
        isMine={isMine}
        hasCommonFriends={hasCommonFriends}
      />
    ),
    [friendLevel, hasCommonFriends, isMine]
  )

  const renderItem = useCallback(
    ({item}: {item: ListItem}) => {
      if (item.type === 'friend') {
        return (
          <MemoizedFriendListItem friend={item.friend} trusted={item.trusted} />
        )
      }

      if (item.type === 'club') {
        return <MemoizedClubListItem club={item.club} />
      }

      return (
        <XStack alignItems="center" gap="$2" marginTop="$2">
          <Typography variant="descriptionBold" color="$foregroundSecondary">
            {item.title}
          </Typography>
          {item.onInfoPress ? (
            <Pressable
              onPress={item.onInfoPress}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t(
                'commonFriends.trustedFriendsExplanation.title'
              )}
            >
              <InfoCircle size={16} color={theme.foregroundTertiary.get()} />
            </Pressable>
          ) : null}
        </XStack>
      )
    },
    [t, theme]
  )

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
        ListHeaderComponent={ListHeaderWithProps}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: bottom}}
      />
    </Screen>
  )
}

export default CommonFriendsScreen
