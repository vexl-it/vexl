import {RefreshControl, ScrollView} from 'react-native'
import {Stack, YStack} from 'tamagui'
import Button from './Button'
import Image from './Image'
import usePixelsFromBottomWhereTabsEnd from './InsideRouter/utils'
import anonymousAvatarHappyNoBackgroundSvg from './images/anonymousAvatarHappyNoBackgroundSvg'

interface ContentProps {
  buttonText?: string | undefined
  children: React.ReactNode
  onButtonPress?: () => void
}

function EmptyListContent({
  children,
  buttonText,
  onButtonPress,
}: ContentProps): JSX.Element {
  return (
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
  )
}

interface Props extends ContentProps {
  inScrollView?: boolean
  refreshing?: boolean | undefined
  onRefresh?: () => void
}

function EmptyListWrapper({
  buttonText,
  children,
  inScrollView,
  onButtonPress,
  refreshing = false,
  onRefresh,
}: Props): JSX.Element {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return inScrollView ? (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
    >
      <EmptyListContent buttonText={buttonText} onButtonPress={onButtonPress}>
        {children}
      </EmptyListContent>
    </ScrollView>
  ) : (
    <Stack f={1} ai="center" jc="center">
      <EmptyListContent buttonText={buttonText} onButtonPress={onButtonPress}>
        {children}
      </EmptyListContent>
    </Stack>
  )
}

export default EmptyListWrapper
