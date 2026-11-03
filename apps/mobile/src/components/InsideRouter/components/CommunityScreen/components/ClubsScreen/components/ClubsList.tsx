import {
  ClubReachCard,
  EmptyState,
  getTokens,
  RefreshControl,
  Stack,
  YStack,
} from '@vexl-next/ui'
import {Effect, pipe} from 'effect'
import {isNonEmptyArray} from 'effect/Array'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {FlatList} from 'react-native'
import {type CommunityTabsScreenProps} from '../../../../../../../navigationTypes'
import {
  clubsWithMembersAtomsAtom,
  clubsWithMembersLoadingStateAtom,
} from '../../../../../../../state/clubs/atom/clubsWithMembersAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../../../../../../../state/clubs/atom/refreshClubsActionAtom'
import {clubsConnectionsReachAtom} from '../../../../../../../state/connections/atom/connectionStateAtom'
import atomKeyExtractor from '../../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../../utils/localization/formattingLocaleAtom'
import {useShowReachExplanation} from '../../../../../../useShowReachExplanation'
import ClubCardItem from '../../ClubCardItem'

type Navigation = CommunityTabsScreenProps<'Clubs'>['navigation']

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
      renderItem={({item}) => <ClubCardItem clubWithMembersAtom={item} />}
      keyExtractor={atomKeyExtractor}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: getTokens().space.$7.val,
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
