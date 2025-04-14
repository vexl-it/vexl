import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {Stack, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {singleClubAtom} from '../../state/clubs/atom/clubsWithMembersAtom'
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

  return (
    <Screen>
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
    </Screen>
  )
}
