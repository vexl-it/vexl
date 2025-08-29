import {useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import {showGoldenAvatarInfoModalActionAton} from './GoldenAvatar/atoms'
import Image from './Image'
import goldenGlassesSvg from './images/goldenGlassesSvg'

function ParticipatedInMeetup(): React.ReactElement {
  const {t} = useTranslation()
  const showGoldenAvatarInfoModal = useSetAtom(
    showGoldenAvatarInfoModalActionAton
  )

  return (
    <TouchableOpacity onPress={showGoldenAvatarInfoModal}>
      <Stack
        alignItems="center"
        paddingHorizontal="$2"
        paddingBottom="$2"
        borderColor="$main"
        borderWidth={1}
        borderRadius="$4"
        marginTop="$2"
      >
        <Image height={70} width={90} source={goldenGlassesSvg} />
        <Text fontFamily="$heading" color="$main">
          {t('settings.joinedMeetup')}
        </Text>
      </Stack>
    </TouchableOpacity>
  )
}

export default ParticipatedInMeetup
