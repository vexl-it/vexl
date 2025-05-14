import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {RefreshControl} from 'react-native-gesture-handler'
import {getTokens, ScrollView, Stack, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {
  clubsWithMembersLoadingStateAtom,
  singleClubAtom,
} from '../../state/clubs/atom/clubsWithMembersAtom'
import {syncSingleClubHandleStateWhenNotFoundActionAtom} from '../../state/clubs/atom/refreshClubsActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {ClubDetail} from './components/ClubDetail'

type Props = RootStackScreenProps<'ClubDetail'>

export function ClubDetailScreen({
  route: {
    params: {clubUuid},
  },
}: Props): JSX.Element {
  const club = useAtomValue(useMemo(() => singleClubAtom(clubUuid), [clubUuid]))
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const syncSingleClubHandleStateWhenNotFound = useSetAtom(
    syncSingleClubHandleStateWhenNotFoundActionAtom
  )
  const clubsLoading =
    useAtomValue(clubsWithMembersLoadingStateAtom).state === 'loading'

  return (
    <Screen>
      <ScrollView
        f={1}
        indicatorStyle="white"
        refreshControl={
          <RefreshControl
            refreshing={clubsLoading}
            onRefresh={() =>
              Effect.runFork(syncSingleClubHandleStateWhenNotFound({clubUuid}))
            }
            tintColor={getTokens().color.greyAccent5.val}
          />
        }
      >
        <Stack mx="$4" my="$4" f={1}>
          <ScreenTitle text="" withBackButton></ScreenTitle>
          {Option.isSome(club) ? (
            <ClubDetail club={club.value} />
          ) : (
            <YStack alignItems="center" gap="$4" f={1} alignContent="center">
              <Text fontFamily="$body500" fs={25}>
                {t('common.nothingFound')}
              </Text>
              <Button
                onPress={safeGoBack}
                variant="secondary"
                text={t('common.goBack')}
              />
            </YStack>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  )
}
