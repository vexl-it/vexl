import {Stack, Typography} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
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
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="left"
        >
          {t('goldenGlasses.userJoinedOneOfOurChosenVexlMeetups')}
        </Typography>
      )}
      {!!showDescription && (
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textAlign="left"
        >
          {t('goldenGlasses.goAndTryToFindYours')}
        </Typography>
      )}
      <TouchableOpacity onPress={openUrl(t('common.communityUrl'))}>
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textDecorationLine="underline"
        >
          {t('common.communityUrl')}
        </Typography>
      </TouchableOpacity>
    </Stack>
  )
}

export default GoldenAvatarInfoModalContent
