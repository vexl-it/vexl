import {Text, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import anonymousAvatarHappyNoBackgroundSvg from '../../images/anonymousAvatarHappyNoBackgroundSvg'

export default function ClubsScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <YStack
      p="$3"
      f={1}
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
    </YStack>
  )
}
