import {
  type FullScreenWarning,
  type NewsAndAnnouncementsResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Button,
  FaqWhatIsVexl,
  FullscreenWarningRedGraphic,
  FullscreenWarningYellowGraphic,
  NavigationBar,
  Screen,
  Stack,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Option} from 'effect'
import React from 'react'
import openUrl from '../../../utils/openUrl'

function WarningGraphic({
  type,
}: {
  readonly type: FullScreenWarning['type']
}): React.ReactElement {
  if (type === 'RED') {
    return <FullscreenWarningRedGraphic animate />
  }

  if (type === 'YELLOW') {
    return <FullscreenWarningYellowGraphic animate />
  }

  return <FaqWhatIsVexl animate width={174} height={174} />
}

export function FullscreenWarningComponent({
  data: {action, cancelable, description, title, type},
  onCancel,
}: {
  data: Option.Option.Value<NewsAndAnnouncementsResponse['fullScreenWarning']>
  onCancel: () => void
}): React.ReactElement {
  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          rightActions={
            cancelable
              ? [
                  {
                    icon: XmarkCancelClose,
                    onPress: onCancel,
                  },
                ]
              : undefined
          }
        />
      }
      footer={
        Option.isSome(action) ? (
          <Button
            onPress={openUrl(action.value.url)}
            variant={type === 'RED' ? 'destructive' : 'secondary'}
          >
            {action.value.text}
          </Button>
        ) : undefined
      }
    >
      <YStack flex={1} justifyContent="center" gap="$8" paddingBottom="$8">
        <Stack alignItems="center" justifyContent="center">
          <WarningGraphic type={type} />
        </Stack>

        <YStack gap="$5">
          <Typography
            variant="heading3"
            color="$foregroundPrimary"
            textAlign="center"
            adjustsFontSizeToFit
            numberOfLines={3}
          >
            {title}
          </Typography>

          <Typography
            variant="paragraph"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {description}
          </Typography>
        </YStack>
      </YStack>
    </Screen>
  )
}
