import {useNavigation} from '@react-navigation/native'
import {Effect} from 'effect'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import {FlatList} from 'react-native'
import {RefreshControl} from 'react-native-gesture-handler'
import {getTokens, Image, Stack, Text, XStack, YStack} from 'tamagui'
import membersSvg from '../../../../../images/memberSvg'
import {
  clubsWithMembersAtomsAtom,
  clubsWithMembersLoadingStateAtom,
} from '../../../../../state/clubs/atom/clubsWithMembersAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../../../../../state/clubs/atom/refreshClubsActionAtom'
import {type ClubWithMembers} from '../../../../../state/clubs/domain'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../../../utils/localization/localizedNumbersAtoms'
import Button from '../../../../Button'
import SvgImage from '../../../../Image'
import {EmptyListPlaceholder} from './EmptyListPlaceholder'

function ClubListItem({atom}: {atom: Atom<ClubWithMembers>}): JSX.Element {
  const {club, members} = useAtomValue(atom)
  const navigation = useNavigation()
  const {t} = useTranslation()
  const membersCount = useSetAtom(localizedDecimalNumberActionAtom)({
    number: members.length,
  })

  return (
    <XStack gap="$2" alignItems="center">
      <Image width={48} height={48} br="$2" src={club.clubImageUrl} />
      <YStack f={1}>
        <Text
          numberOfLines={1}
          lineBreakMode="tail"
          fontSize={18}
          fontFamily="$body600"
        >
          {club.name}
        </Text>
        <XStack gap="$1" alignItems="center">
          <SvgImage width={16} height={16} stroke="white" source={membersSvg} />
          <Text fontSize={16} fontFamily="$body400">
            {t('clubs.members', {
              membersCount,
            })}
          </Text>
        </XStack>
      </YStack>
      <Button
        text={t('common.seeDetail')}
        variant="secondary"
        onPress={() => {
          navigation.navigate('ClubDetail', {clubUuid: club.uuid})
        }}
        size="medium"
      />
    </XStack>
  )
}

function Separator(): JSX.Element {
  return (
    <Stack width="100%" height={32} jc="center" als="center">
      <Stack height={2} bg="$grey" />
    </Stack>
  )
}

function renderItem({item}: {item: Atom<ClubWithMembers>}): JSX.Element {
  return <ClubListItem atom={item} />
}
export function ClubsList(): JSX.Element {
  const syncAllClubsHandleStateWhenNotFound = useSetAtom(
    syncAllClubsHandleStateWhenNotFoundActionAtom
  )
  const clubsAtoms = useAtomValue(clubsWithMembersAtomsAtom)
  const clubsLoading =
    useAtomValue(clubsWithMembersLoadingStateAtom).state === 'loading'

  if (clubsAtoms.length === 0) {
    return <EmptyListPlaceholder />
  }

  // TODO: Replace with FlashList once stable v2 is released
  // v1 contains bug: https://github.com/Shopify/flash-list/issues/633
  return (
    <FlatList
      data={clubsAtoms}
      ItemSeparatorComponent={Separator}
      renderItem={renderItem}
      keyExtractor={atomKeyExtractor}
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={clubsLoading ?? false}
          onRefresh={() =>
            Effect.runFork(syncAllClubsHandleStateWhenNotFound())
          }
          tintColor={getTokens().color.greyAccent5.val}
        />
      }
    />
  )
}
