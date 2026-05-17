import {
  Button,
  ClubCard,
  Stack,
  Typography,
  useTheme,
  YStack,
} from '@vexl-next/ui'
import {Effect, pipe} from 'effect'
import {isNonEmptyArray} from 'effect/Array'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {FlatList, RefreshControl} from 'react-native'
import {type CommunityTabsScreenProps} from '../../../../../../../navigationTypes'
import {
  clubsWithMembersAtomsAtom,
  clubsWithMembersLoadingStateAtom,
} from '../../../../../../../state/clubs/atom/clubsWithMembersAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../../../../../../../state/clubs/atom/refreshClubsActionAtom'
import {type ClubWithMembers} from '../../../../../../../state/clubs/domain'
import atomKeyExtractor from '../../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import ClubAvatar from './ClubAvatar'

type Navigation = CommunityTabsScreenProps<'Clubs'>['navigation']

function ClubListItem({
  atom,
  navigation,
}: {
  readonly atom: Atom<ClubWithMembers>
  readonly navigation: Navigation
}): React.ReactElement {
  const {club, members} = useAtomValue(atom)
  const {t} = useTranslation()

  return (
    <ClubCard
      avatar={<ClubAvatar uri={club.clubImageUrl} />}
      name={club.name}
      subtitle={t('clubs.commonFriends', {count: members.length})}
      onPress={() => {
        navigation.navigate('ClubDetail', {clubUuid: club.uuid})
      }}
    />
  )
}

function EmptyClubs({
  onJoinPress,
  onInfoPress,
}: {
  readonly onJoinPress: () => void
  readonly onInfoPress: () => void
}): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <YStack flex={1} alignItems="center" paddingTop="$8" gap="$5">
      <Typography
        variant="heading3"
        color="$foregroundPrimary"
        textAlign="center"
      >
        {t('clubs.joinYourFirstClub')}
      </Typography>
      <Typography
        variant="description"
        color="$foregroundSecondary"
        textAlign="center"
      >
        {t('clubs.joinYourFirstClubDescription')}
      </Typography>
      <Button
        size="small"
        variant="tertiary"
        onPress={onJoinPress}
        width="100%"
      >
        {t('clubs.joinNewClub')}
      </Button>
      <Typography
        variant="micro"
        color="$accentHighlightPrimary"
        onPress={onInfoPress}
      >
        {t('suggestion.whatAreClubs')}
      </Typography>
    </YStack>
  )
}

function Separator(): React.JSX.Element {
  return <Stack height="$3" />
}

export function ClubsList({
  navigation,
}: {
  readonly navigation: Navigation
}): React.ReactElement {
  const syncAllClubsHandleStateWhenNotFound = useSetAtom(
    syncAllClubsHandleStateWhenNotFoundActionAtom
  )
  const clubsAtoms = useAtomValue(clubsWithMembersAtomsAtom)
  const clubsLoading =
    useAtomValue(clubsWithMembersLoadingStateAtom).state === 'loading'
  const theme = useTheme()

  const handleJoinPress = (): void => {
    navigation.navigate('JoinClubFlow', {
      screen: 'ScanClubQrCodeScreen',
    })
  }

  const handleInfoPress = (): void => {
    navigation.navigate('WhatAreClubs')
  }

  return (
    <FlatList
      data={clubsAtoms}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={
        <EmptyClubs
          onJoinPress={handleJoinPress}
          onInfoPress={handleInfoPress}
        />
      }
      renderItem={({item}) => (
        <ClubListItem atom={item} navigation={navigation} />
      )}
      keyExtractor={atomKeyExtractor}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={clubsLoading}
          onRefresh={() => {
            pipe(syncAllClubsHandleStateWhenNotFound(), Effect.runFork)
          }}
          tintColor={theme.foregroundSecondary.get()}
        />
      }
      ListFooterComponent={
        isNonEmptyArray(clubsAtoms) ? <Stack height="$2" /> : null
      }
    />
  )
}
