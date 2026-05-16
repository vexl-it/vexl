import {type ChatMessageRequiringNewerVersion} from '@vexl-next/domain/src/general/messaging'
import {compare} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {
  Button,
  InfoCircle,
  Stack,
  Typography,
  XStack,
  useTheme,
} from '@vexl-next/ui'
import React from 'react'
import {version} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import openUrl from '../../../utils/openUrl'

const DOWNLOAD_URL = 'https://vexl.it/download'

export default function MessageIncompatibleItem({
  message,
}: {
  message: ChatMessageRequiringNewerVersion
}): React.ReactElement | null {
  const {t} = useTranslation()
  const theme = useTheme()

  // There is nothing we can do now. If we were unable to recover the message...
  if (compare(message.minimalRequiredVersion)('<=', version)) return null

  return (
    <Stack mx="$4" mt="$1" flex={1} alignItems="flex-start">
      <Stack
        gap="$2"
        maxWidth="80%"
        br="$6"
        backgroundColor="$backgroundSecondary"
        p="$3"
      >
        <XStack gap="$2" alignItems="center">
          <InfoCircle size={18} color={theme.redForeground.get()} />
          <Typography variant="descriptionBold" color="$foregroundPrimary">
            {t('messages.incompatible.title')}
          </Typography>
        </XStack>
        <Typography variant="micro" color="$redForeground">
          {t('messages.incompatible.text', {
            targetVersion: message.minimalRequiredVersion,
          })}
        </Typography>
        <Button
          size="small"
          variant="destructive"
          onPress={openUrl(DOWNLOAD_URL)}
        >
          {t('ForceUpdateScreen.action')}
        </Button>
      </Stack>
    </Stack>
  )
}
