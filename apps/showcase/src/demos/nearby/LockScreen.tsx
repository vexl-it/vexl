import {Typography, YStack} from '@vexl-next/ui'
import {Arrive} from '../shared/chat'
import {SystemNotification} from '../shared/PushNotification'

/** Their locked phone, with Vexl scanning in the background. */
export function LockScreen({
  notified,
  tapNotification,
}: {
  notified: boolean
  tapNotification: boolean
}): React.JSX.Element {
  return (
    <div className="nearby-lock">
      <YStack alignItems="center" pt={96}>
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          Thursday, October 8
        </Typography>
        <Typography
          variant="presBody"
          color="$foregroundPrimary"
          fontSize={84}
          lineHeight={96}
        >
          9:41
        </Typography>
      </YStack>
      <YStack gap="$3" px="$4" pt="$8">
        {notified ? (
          <Arrive>
            <SystemNotification
              title="New offer nearby"
              body="Take a look before they’re gone."
              tap={tapNotification}
            />
          </Arrive>
        ) : null}
        <SystemNotification title="Vexl is looking for offers nearby" />
      </YStack>
    </div>
  )
}

/** A black screen that lights up when `waking` turns true. */
export function ScreenOff({waking}: {waking: boolean}): React.JSX.Element {
  return <div className={waking ? 'nearby-off is-waking' : 'nearby-off'} />
}
