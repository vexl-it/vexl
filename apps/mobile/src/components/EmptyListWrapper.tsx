import {RefreshControl, ScrollView} from 'react-native'
import {Stack, YStack} from 'tamagui'
import Button from './Button'
import Image from './Image'
import usePixelsFromBottomWhereTabsEnd from './InsideRouter/utils'
import anonymousAvatarHappyNoBackgroundSvg from './images/anonymousAvatarHappyNoBackgroundSvg'

interface Props {
  buttonText?: string | undefined
  children: React.ReactNode
  onButtonPress?: () => void
  refreshEnabled?: boolean
  refreshing?: boolean | undefined
  onRefresh?: () => void
}

function EmptyListWrapper({
  buttonText,
  children,
  onButtonPress,
  refreshEnabled = false,
  refreshing = false,
  onRefresh,
}: Props): JSX.Element {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return (
    <ScrollView
      refreshControl={
        refreshEnabled ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : (
          <></>
        )
      }
      contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
    >
      <YStack f={1} ai="center" jc="center" py="$4" space="$4">
        <Stack ai="center" jc="center" p="$2" bc="$grey" br="$6">
          <Image source={anonymousAvatarHappyNoBackgroundSvg} />
        </Stack>
        {children}
        {!!buttonText && !!onButtonPress && (
          <Button
            text={buttonText}
            variant="primary"
            size="small"
            onPress={onButtonPress}
          />
        )}
      </YStack>
    </ScrollView>
  )
}

export default EmptyListWrapper
