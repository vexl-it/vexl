import {FlashList} from '@shopify/flash-list'
import {type ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {useAtomValue, useStore} from 'jotai'
import React, {useMemo} from 'react'
import {getTokens, Stack, Text} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useGetAllClubsForIds} from '../../state/clubs/atom/clubsWithMembersAtom'
import createImportedContactsForHashesAtom from '../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import CommonClubListItem from './components/CommonClubsListItem'
import CommonFriendsListItem from './components/CommonFriendsListItem'

type Props = RootStackScreenProps<'CommonFriends'>

type ItemProps =
  | {
      tag: 'commonFriend'
      friend: StoredContactWithComputedValues
      verified: boolean
    }
  | {tag: 'club'; club: ClubInfo}
  | {tag: 'sectionHeader'; title: string}

function keyExtractor(item: ItemProps, index: number): string {
  if (item.tag === 'commonFriend') return item.friend.computedValues.hash
  if (item.tag === 'club') return item.club.uuid
  return `section-header-${index}`
}

function renderItem({item}: {item: ItemProps}): React.ReactElement {
  if (item.tag === 'sectionHeader')
    return (
      <Text ff="$body600" fos={14} col="$greyOnWhite" mt="$2">
        {item.title}
      </Text>
    )
  if (item.tag === 'commonFriend')
    return (
      <CommonFriendsListItem friend={item.friend} verified={item.verified} />
    )
  return <CommonClubListItem club={item.club} />
}

function ItemSeparatorComponent(): React.ReactElement {
  return <Stack h={16} />
}

function CommonFriendsScreen({
  route: {
    params: {contactsHashes, verifiedHashes, clubsIds},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const safeGoBack = useSafeGoBack()
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()
  const showVerifiedContacts = useAtomValue(showVerifiedContactsAtom)
  const clubs = useGetAllClubsForIds(clubsIds).map((club) => ({
    tag: 'club' as const,
    club,
  }))

  const verifiedHashesSet = useMemo(
    () =>
      showVerifiedContacts
        ? new Set(verifiedHashes ?? [])
        : new Set<HashedPhoneNumber>(),
    [verifiedHashes, showVerifiedContacts]
  )

  const dataToDisplay = useMemo(() => {
    const friends = store
      .get(createImportedContactsForHashesAtom(contactsHashes))
      .map((friend) => ({
        tag: 'commonFriend' as const,
        friend,
        verified: verifiedHashesSet.has(friend.computedValues.hash),
      }))

    if (!showVerifiedContacts) {
      return [...clubs, ...friends]
    }

    const verifiedFriends = friends.filter((f) => f.verified)
    const commonFriends = friends.filter((f) => !f.verified)

    const sections: ItemProps[] = [...clubs]

    if (verifiedFriends.length > 0) {
      sections.push({
        tag: 'sectionHeader',
        title: t('commonFriends.verifiedFriends'),
      })
      sections.push(...verifiedFriends)
    }

    if (commonFriends.length > 0) {
      sections.push({
        tag: 'sectionHeader',
        title: t('commonFriends.commonFriends'),
      })
      sections.push(...commonFriends)
    }

    return sections
  }, [clubs, contactsHashes, store, verifiedHashesSet, showVerifiedContacts, t])

  return (
    <Screen customHorizontalPadding={getTokens().space[1].val} bc="$white">
      <Stack f={1} mb="$2">
        <ScreenTitle
          text={t('commonFriends.commonFriends')}
          textColor="$black"
          withBackButton
        />
        <FlashList
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
