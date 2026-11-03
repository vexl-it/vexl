import {
  type FullScreenWarning,
  type NewsAndAnnouncementsResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  Button,
  EmptyState,
  FaqWhatIsVexl,
  FullscreenWarningRedGraphic,
  FullscreenWarningYellowGraphic,
  NavigationBar,
  Screen,
  XmarkCancelClose,
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
      <EmptyState
        fullscreen
        graphic={<WarningGraphic type={type} />}
        title={title}
        description={description}
      />
    </Screen>
  )
}
