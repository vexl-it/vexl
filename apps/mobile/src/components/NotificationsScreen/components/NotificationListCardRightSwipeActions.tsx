import {Stack, TrashBin, Typography, useTheme, YStack} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {useTranslation} from '../../../utils/localization/I18nProvider'

function NotificationListCardRightSwipeActions(
  props: TouchableOpacityProps
): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <TouchableOpacity {...props}>
      <Stack pl="$2" pr="$5">
        <Stack
          w={88}
          h="100%"
          backgroundColor="$redBackground"
          borderRadius="$4"
          als="center"
          jc="center"
        >
          <YStack ai="center" gap="$1">
            <TrashBin size={24} color={theme.foregroundPrimary.val} />
            <Typography color="$foregroundPrimary" variant="micro">
              {t('common.delete')}
            </Typography>
          </YStack>
        </Stack>
      </Stack>
    </TouchableOpacity>
  )
}

export default NotificationListCardRightSwipeActions
