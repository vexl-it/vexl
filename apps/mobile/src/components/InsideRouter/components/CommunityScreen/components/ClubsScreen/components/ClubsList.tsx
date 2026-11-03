import {
  ClubCard,
  ClubReachCard,
  EmptyState,
  RefreshControl,
  Stack,
  YStack,
} from '@vexl-next/ui'
import {Effect, pipe} from 'effect'
import {isNonEmptyArray} from 'effect/Array'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {FlatList} from 'react-native'
import {type CommunityTabsScreenProps} from '../../../../../../../navigationTypes'
import {
  clubsWithMembersAtomsAtom,
  clubsWithMembersLoadingStateAtom,
} from '../../../../../../../state/clubs/atom/clubsWithMembersAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../../../../../../../state/clubs/atom/refreshClubsActionAtom'
import {type ClubWithMembers} from '../../../../../../../state/clubs/domain'
import {clubsConnectionsReachAtom} from '../../../../../../../state/connections/atom/connectionStateAtom'
import atomKeyExtractor from '../../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../../utils/localization/formattingLocaleAtom'
import {useShowReachExplanation} from '../../../../../../useShowReachExplanation'
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
  const locale = useAtomValue(formattingLocaleAtom)

  return (
    <ClubCard
      avatar={<ClubAvatar uri={club.clubImageUrl} />}
      name={club.name}
      subtitle={t('clubs.commonFriendsFormatted', {
        localizedString: formatInteger(members.length, locale),
      })}
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
    <EmptyState
      title={t('clubs.joinYourFirstClub')}
      description={t('clubs.joinYourFirstClubDescription')}
      action={{label: t('clubs.joinNewClub'), onPress: onJoinPress}}
      link={{label: t('suggestion.whatAreClubs'), onPress: onInfoPress}}
    />
  )
}

function Separator(): React.JSX.Element {
  return <Stack height="$3" />
}

function ClubsReachFooter(): React.JSX.Element {
  const {t} = useTranslation()
  const showReachExplanation = useShowReachExplanation('clubs')
  const clubsReach = useAtomValue(clubsConnectionsReachAtom)
  const locale = useAtomValue(formattingLocaleAtom)

  return (
    <YStack paddingTop="$3" gap="$2">
      <ClubReachCard
        onReachPress={showReachExplanation}
        title={t('clubs.clubsReach')}
        reachLabel={t('offerForm.friendLevel.reachPeopleFormatted', {
          localizedString: formatInteger(clubsReach, locale),
        })}
      />
      <Stack height="$2" />
    </YStack>
  )
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
        />
      }
      ListFooterComponent={
        isNonEmptyArray(clubsAtoms) ? <ClubsReachFooter /> : null
      }
    />
  )
}
