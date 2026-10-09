import {Image, Typography, XStack, YStack} from '@vexl-next/ui'
import {Tap} from './Tap'

/** A system notification from Vexl, as the lock screen lists it. */
export function SystemNotification({
  title,
  body,
  tap = false,
}: {
  title: string
  body?: string
  tap?: boolean
}): React.JSX.Element {
  return (
    <Tap on={tap}>
      <XStack
        gap="$4"
        alignItems="center"
        padding="$4"
        borderRadius="$6"
        backgroundColor="$backgroundTertiary"
      >
        <Image
          source={{uri: '/favicon.svg'}}
          width={38}
          height={38}
          borderRadius="$3"
        />
        <YStack flex={1} gap="$1">
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {title}
          </Typography>
          {body ? (
            <Typography variant="description" color="$foregroundSecondary">
              {body}
            </Typography>
          ) : null}
        </YStack>
      </XStack>
    </Tap>
  )
}

/** The notification sliding in over the open app when someone answers your offer. */
export function PushNotification({tap}: {tap: boolean}): React.JSX.Element {
  return (
    <div className="demo-notification">
      <SystemNotification
        title="New response to your offer"
        body="Someone wants to connect with you."
        tap={tap}
      />
    </div>
  )
}
