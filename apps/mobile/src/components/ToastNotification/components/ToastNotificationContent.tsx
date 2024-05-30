import {useWindowDimensions} from 'react-native'
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import SvgImage from '../../Image'
import {type ToastNotificationState} from '../index'

function ToastNotificationContent(
  state: ToastNotificationState
): JSX.Element | null {
  const {height} = useWindowDimensions()

  return (
    <Stack als="center" pos="absolute" t={height * 0.1}>
      <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
        <XStack ai="center" space="$2" px="$4" py="$2" bc="$main" br="$4">
          {!!state.icon && (
            <SvgImage
              stroke={getTokens().color.black.val}
              source={state.icon}
            />
          )}
          <Text col="$black">{state.text}</Text>
        </XStack>
      </Animated.View>
    </Stack>
  )
}

export default ToastNotificationContent
