import {Image, Typography, XStack, YStack} from '@vexl-next/ui'
import {Tap} from '../../shared/Tap'

/** The system notification Vexl shows when someone answers your offer. */
export function PushNotification({tap}: {tap: boolean}): React.JSX.Element {
  return (
    <div className="demo-notification">
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
              New response to your offer
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              Someone wants to connect with you.
            </Typography>
          </YStack>
        </XStack>
      </Tap>
    </div>
  )
}
