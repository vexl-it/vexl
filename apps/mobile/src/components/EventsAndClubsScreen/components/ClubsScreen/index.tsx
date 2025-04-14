import {useAtomValue} from 'jotai'
import {Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {showClubsFlowAtom} from '../../../../utils/preferences'
import Image from '../../../Image'
import anonymousAvatarHappyNoBackgroundSvg from '../../../images/anonymousAvatarHappyNoBackgroundSvg'
import {ClubsListScreen} from './components/ClubsListScreen'

function TodoScreen(): JSX.Element {
  const {t} = useTranslation()

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
    </YStack>
  )
}

export default function ClubsScreen(): JSX.Element {
  const showClubsFlow = useAtomValue(showClubsFlowAtom)

  if (!showClubsFlow) {
    return <TodoScreen />
  }

  return <ClubsListScreen />
}
