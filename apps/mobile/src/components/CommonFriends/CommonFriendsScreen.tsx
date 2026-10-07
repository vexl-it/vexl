import {FlashList} from '@shopify/flash-list'
import {
  InfoCircle,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, XStack, YStack, getTokens, useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {
  MemoizedClubListItem,
  MemoizedFriendListItem,
} from './CommonFriendsListRows'
import useCommonFriendsListData, {
  type ListItem,
} from './useCommonFriendsListData'

function ItemSeparator(): React.ReactElement {
  return <Stack height="$3" />
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

function SectionListItem({
  item,
}: {
  readonly item: Extract<ListItem, {type: 'section'}>
}): React.ReactElement {
  const theme = useTheme()
  return (
    <YStack gap="$2" mt="$2">
      <XStack
        gap="$2"
        alignItems="center"
        onPress={item.onInfoPress}
        role={item.onInfoPress ? 'button' : undefined}
        aria-label={item.onInfoPress ? item.title : undefined}
        pressStyle={item.onInfoPress ? {opacity: 0.7} : undefined}
      >
        <Typography variant="descriptionBold" color="$foregroundSecondary">
          {item.title}
        </Typography>
        {item.onInfoPress ? (
          <InfoCircle
            size={getTokens().size.$5.val}
            color={theme.foregroundSecondary.get()}
          />
        ) : null}
      </XStack>
      {item.caption ? (
        <Typography variant="micro" color="$foregroundSecondary">
          {item.caption}
        </Typography>
      ) : null}
    </YStack>
  )
}

type Props = RootStackScreenProps<'CommonFriends'>

function CommonFriendsScreen({
  route: {
    params: {contactsHashes, verifiedHashes, clubs, role},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {bottom} = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack()
  const data = useCommonFriendsListData({
    contactsHashes,
    verifiedHashes,
    clubs,
    role,
  })
  const hasCommonFriends = contactsHashes.length > 0

  const ListHeaderWithProps = useCallback(
    () => <ListHeader hasCommonFriends={hasCommonFriends} />,
    [hasCommonFriends]
  )

  const renderItem = useCallback(({item}: {item: ListItem}) => {
    if (item.type === 'friend') {
      return (
        <MemoizedFriendListItem friend={item.friend} trusted={item.trusted} />
      )
    }

    if (item.type === 'club') {
      return <MemoizedClubListItem club={item.club} />
    }

    return <SectionListItem item={item} />
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
        ListHeaderComponent={ListHeaderWithProps}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: bottom}}
      />
    </Screen>
  )
}

export default CommonFriendsScreen
