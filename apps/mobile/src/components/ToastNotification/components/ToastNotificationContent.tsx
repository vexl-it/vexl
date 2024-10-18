import {useSetAtom} from 'jotai'
import {TouchableOpacity, useWindowDimensions} from 'react-native'
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'
import {toastNotificationAtom} from '../atom'
import {type ToastNotificationState} from '../domain'

function ToastNotificationContent({
  icon,
  iconFill,
  text,
  showCloseButton,
  position,
}: ToastNotificationState): JSX.Element | null {
  const {height} = useWindowDimensions()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Stack
      f={1}
      px="$2"
      {...(position === 'bottom'
        ? {bottom: height * 0.1}
        : {top: height * 0.1})}
    >
      <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
        <XStack
          ai="center"
          jc={showCloseButton ? 'space-between' : undefined}
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
              fill={iconFill ?? 'none'}
              stroke={iconFill ? undefined : getTokens().color.black.val}
              source={icon}
            />
          )}
          <Stack f={1} alignItems="center">
            <Text flexShrink={1} col="$black">
              {text}
            </Text>
          </Stack>
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
