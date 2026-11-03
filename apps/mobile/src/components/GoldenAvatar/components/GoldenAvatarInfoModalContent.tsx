import {Button, Stack, Typography} from '@vexl-next/ui'
import React from 'react'
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
      <Button variant="link" onPress={openUrl(t('common.communityUrl'))}>
        {t('common.communityUrl')}
      </Button>
    </Stack>
  )
}

export default GoldenAvatarInfoModalContent
