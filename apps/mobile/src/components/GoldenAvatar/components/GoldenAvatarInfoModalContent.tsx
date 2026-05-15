import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import openUrl from '../../../utils/openUrl'

function GoldenAvatarInfoModalContent({
  showTitle = true,
  showDescription = true,
}: {
  showTitle?: boolean
  showDescription?: boolean
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack gap="$2">
      {!!showTitle && (
        <Text
          fontFamily="$heading"
          fontSize={24}
          color="$black"
          textAlign="left"
        >
          {t('goldenGlasses.userJoinedOneOfOurChosenVexlMeetups')}
        </Text>
      )}
      {!!showDescription && (
        <Text fontSize={18} color="$greyOnWhite" textAlign="left">
          {t('goldenGlasses.goAndTryToFindYours')}
        </Text>
      )}
      <TouchableOpacity onPress={openUrl(t('common.communityUrl'))}>
        <Text fos={18} textDecorationLine="underline" col="$greyOnWhite">
          {t('common.communityUrl')}
        </Text>
      </TouchableOpacity>
    </Stack>
  )
}

export default GoldenAvatarInfoModalContent
