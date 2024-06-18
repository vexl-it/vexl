import {useSetAtom} from 'jotai'
import {TouchableOpacity, useWindowDimensions} from 'react-native'
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'
import {toastNotificationAtom, type ToastNotificationState} from '../index'

function ToastNotificationContent({
  icon,
  iconFill,
  text,
  showCloseButton,
}: ToastNotificationState): JSX.Element | null {
  const {height, width} = useWindowDimensions()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Stack als="center" w={width * 0.95} pos="absolute" t={height * 0.1}>
      <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
        <XStack
          ai="center"
          jc="space-between"
          space="$2"
          px="$2"
          py="$2"
          bc="$main"
          br="$4"
        >
          {!!icon && (
            <SvgImage
              width={16}
              height={16}
              fill={iconFill}
              stroke={iconFill ? undefined : getTokens().color.black.val}
              source={icon}
            />
          )}
          <Text flexShrink={1} col="$black">
            {text}
          </Text>
          {!!showCloseButton && (
            <TouchableOpacity
              onPress={() => {
                setToastNotification(null)
              }}
            >
              <SvgImage
                width={16}
                height={16}
                source={closeSvg}
                stroke={getTokens().color.black.val}
              />
            </TouchableOpacity>
          )}
        </XStack>
      </Animated.View>
    </Stack>
  )
}

export default ToastNotificationContent
