import {Stack, TagLabel, Typography, useTheme, YStack} from '@vexl-next/ui'
import React from 'react'
import {Pressable, type PressableProps} from 'react-native-gesture-handler'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function ChatListItemLeftSwipeActions(
  props: PressableProps
): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <Pressable {...props}>
      <Stack
        w={88}
        h="100%"
        backgroundColor="$greenBackground"
        als="center"
        jc="center"
      >
        <YStack ai="center" gap="$1">
          <TagLabel size={24} color={theme.foregroundPrimary.get()} />
          <Typography color="$foregroundPrimary" variant="micro">
            {t('messages.tags.action')}
          </Typography>
        </YStack>
      </Stack>
    </Pressable>
  )
}

export default ChatListItemLeftSwipeActions
