import {FlashList} from '@shopify/flash-list'
import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {useStore} from 'jotai'
import React, {useMemo} from 'react'
import {getTokens, Stack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useGetAllClubsForIds} from '../../state/clubs/atom/clubsWithMembersAtom'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import CommonClubListItem from './components/CommonClubsListItem'
import CommonFriendsListItem from './components/CommonFriendsListItem'

type Props = RootStackScreenProps<'CommonFriends'>

type ItemProps =
  | {tag: 'commonFriend'; friend: StoredContactWithComputedValues}
  | {tag: 'club'; club: ClubInfo}

function keyExtractor(item: ItemProps): string {
  if (item.tag === 'commonFriend') return item.friend.computedValues.hash

  return item.club.uuid
}

function renderItem({item}: {item: ItemProps}): React.ReactElement {
  if (item.tag === 'commonFriend')
    return <CommonFriendsListItem friend={item.friend} />

  return <CommonClubListItem club={item.club} />
}

function ItemSeparatorComponent(): React.ReactElement {
  return <Stack h={16} />
}

function CommonFriendsScreen({
  route: {
    params: {contactsHashes, clubsIds},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const safeGoBack = useSafeGoBack()
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()
  const clubs = useGetAllClubsForIds(clubsIds).map((club) => ({
    tag: 'club' as const,
    club,
  }))

  const commonFriends = useMemo(
    () =>
      store
        .get(createImportedContactsForHashesAtom(contactsHashes))
        .map((friend) => ({
          tag: 'commonFriend' as const,
          friend,
        })),
    [contactsHashes, store]
  )

  const dataToDisplay = useMemo(
    () => [...clubs, ...commonFriends],
    [clubs, commonFriends]
  )

  return (
    <Screen customHorizontalPadding={getTokens().space[1].val} bc="$white">
      <Stack f={1} mb="$2">
        <ScreenTitle
          text={t('commonFriends.commonFriends')}
          textColor="$black"
          withBackButton
        />
        <FlashList
          estimatedItemSize={64}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={useMemo(
            () => ({
              paddingHorizontal: getTokens().space[2].val,
              paddingBottom: bottomOffset + Number(getTokens().space[5].val),
            }),
            [bottomOffset]
          )}
          data={dataToDisplay}
          ItemSeparatorComponent={ItemSeparatorComponent}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
        <Button
          onPress={safeGoBack}
          variant="secondary"
          text={t('common.gotIt')}
        />
      </Stack>
    </Screen>
  )
}

export default CommonFriendsScreen
