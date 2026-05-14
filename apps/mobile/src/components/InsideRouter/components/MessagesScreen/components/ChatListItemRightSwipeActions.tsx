import {Stack, TrashBin, Typography, useTheme, YStack} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function ChatListItemRightSwipeActions(
  props: TouchableOpacityProps
): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <TouchableOpacity {...props}>
      <Stack
        w={88}
        h="100%"
        backgroundColor="$redBackground"
        als="center"
        jc="center"
      >
        <YStack ai="center" gap="$1">
          <TrashBin size={24} color={theme.foregroundPrimary.get()} />
          <Typography color="$foregroundPrimary" variant="micro">
            {t('common.delete')}
          </Typography>
        </YStack>
      </Stack>
    </TouchableOpacity>
  )
}

export default ChatListItemRightSwipeActions
