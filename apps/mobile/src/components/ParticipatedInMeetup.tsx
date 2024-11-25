import {Stack, Text} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import Image from './Image'
import goldenGlassesSvg from './images/goldenGlassesSvg'

function ParticipatedInMeetup(): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack
      alignItems="center"
      paddingHorizontal="$2"
      paddingBottom="$2"
      borderColor="$main"
      borderWidth={1}
      borderRadius="$4"
      marginTop="$2"
    >
      <Image height={50} width={60} source={goldenGlassesSvg} />
      <Text fontFamily="$heading" color="$main">
        {t('settings.participatedInMeetup')}
      </Text>
    </Stack>
  )
}

export default ParticipatedInMeetup
