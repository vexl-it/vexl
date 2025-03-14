import {useAtomValue} from 'jotai'
import {Text, YStack} from 'tamagui'
import {type EventsAndClubsTabsScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showClubsFlowAtom} from '../../../utils/preferences'
import Button from '../../Button'
import Image from '../../Image'
import anonymousAvatarHappyNoBackgroundSvg from '../../images/anonymousAvatarHappyNoBackgroundSvg'

type Props = EventsAndClubsTabsScreenProps<'Clubs'>

export default function ClubsScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const showClubsFlow = useAtomValue(showClubsFlowAtom)

  return (
    <YStack
      f={1}
      p="$3"
      gap="$3"
      alignContent="center"
      alignItems="center"
      justifyContent="center"
    >
      <Image
        source={anonymousAvatarHappyNoBackgroundSvg}
        width={100}
        height={100}
      />
      <Text textAlign="center" fontFamily="$body500" fontSize={16}>
        {t('clubs.commingSoon')}
      </Text>

      {!!showClubsFlow && (
        <Button
          variant="secondary"
          text={t('clubs.joinNewClub')}
          onPress={() => {
            navigation.navigate('JoinClubFlow', {
              screen: 'ScanClubQrCodeScreen',
            })
          }}
        />
      )}
    </YStack>
  )
}
