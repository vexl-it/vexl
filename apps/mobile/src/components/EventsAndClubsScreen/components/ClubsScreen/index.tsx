import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {Stack, XStack, YStack} from 'tamagui'
import {type EventsAndClubsTabsScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Button from '../../../Button'
import {ClubsList} from './components/ClubsList'
import {showClubAccessDialogActionAtom} from './utils/requestClubAccessDialog'

type Props = EventsAndClubsTabsScreenProps<'Clubs'>

function ClubsScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()

  const showClubAccessDialog = useSetAtom(showClubAccessDialogActionAtom)

  return (
    <YStack f={1} p="$3" gap="$3">
      <Stack f={1} py="$4">
        <ClubsList />
      </Stack>
      <XStack gap="$2">
        <Button
          fullSize
          variant="primary"
          text={t('clubs.requestAccess')}
          onPress={() => {
            Effect.runFork(showClubAccessDialog())
          }}
        />
        <Button
          fullSize
          variant="secondary"
          text={t('clubs.joinNewClub')}
          onPress={() => {
            navigation.navigate('JoinClubFlow', {
              screen: 'ScanClubQrCodeScreen',
            })
          }}
        />
      </XStack>
    </YStack>
  )
}

export default ClubsScreen
