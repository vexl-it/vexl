import {FlashList} from '@shopify/flash-list'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ChevronLeft,
  EditRow,
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
import {type RootStackScreenProps} from '../../navigationTypes'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
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

type ListItem =
  | {
      readonly type: 'friend'
      readonly friend: StoredContactWithComputedValues
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
  return item.type === 'friend'
    ? item.friend.computedValues.hash
    : `section-${item.title}`
}

function ListHeader(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Typography
      variant="description"
      color="$foregroundPrimary"
      marginBottom="$5"
    >
      {`${t('offer.youSeeThisOfferBecause')} ${t('offer.dontForgetToVerifyTheIdentity')}`}
    </Typography>
  )
}

function CommonFriendsScreen({
  navigation,
  route,
}: RootStackScreenProps<'CommonFriends'>): React.ReactElement {
  const {t} = useTranslation()
  const {bottom} = useSafeAreaInsets()
  const store = useStore()
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)
  const {contactsHashes, verifiedHashes} = route.params
  const handleGoBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

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

  const data = useMemo((): readonly ListItem[] => {
    if (!showVerifiedContacts) {
      return pipe(commonFriends, Array.map(createFriendListItem))
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

    return Array.appendAll(verifiedSection, commonSection)
  }, [commonFriends, showVerifiedContacts, t, verifiedHashesSet])

  const renderItem = useCallback(
    ({item}: {item: ListItem}) =>
      item.type === 'friend' ? (
        <MemoizedFriendListItem friend={item.friend} />
      ) : (
        <Typography
          variant="descriptionBold"
          color="$foregroundSecondary"
          marginTop="$2"
        >
          {item.title}
        </Typography>
      ),
    []
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('commonFriends.commonFriends')}
          leftAction={{icon: ChevronLeft, onPress: handleGoBack}}
          rightActions={[{icon: XmarkCancelClose, onPress: handleGoBack}]}
        />
      }
    >
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: bottom}}
      />
    </Screen>
  )
}

export default CommonFriendsScreen
