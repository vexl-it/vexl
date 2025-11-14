import {useSetAtom} from 'jotai'
import React, {useEffect, useRef} from 'react'
import {Animated, TouchableOpacity, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import SvgImage from '../../Image'
import {TAB_BAR_HEIGHT_PX} from '../../InsideRouter/components/TabBar'
import closeSvg from '../../images/closeSvg'
import {toastNotificationAtom} from '../atom'
import {type ToastNotificationState} from '../domain'

export interface FadeInViewProps {
  children: React.ReactNode
  duration?: number
  visible?: boolean
  directionDown?: boolean // false = fade up, true = fade down
  onFadeOutEnd?: () => void
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  visible = true,
  directionDown = false,
  onFadeOutEnd,
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  // amount to offset vertically
  const offset = 10

  useEffect(() => {
    const startOffset = directionDown ? -offset : offset // down = start above, up = start below
    const endOffset = 0
    const exitOffset = directionDown ? -offset : offset // down = exit below, up = exit above

    if (visible) {
      // reset initial state before animating in
      opacity.setValue(0)
      translateY.setValue(startOffset)

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: endOffset,
          duration,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: exitOffset,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFadeOutEnd?.()
      })
    }
  }, [
    visible,
    duration,
    offset,
    directionDown,
    opacity,
    translateY,
    onFadeOutEnd,
  ])

  return (
    <Animated.View style={{opacity, transform: [{translateY}]}}>
      {children}
    </Animated.View>
  )
}

function ToastNotificationContent({
  icon,
  iconFill,
  visible,
  text,
  showCloseButton,
  position,
  bottomMargin,
  topMargin,
}: ToastNotificationState): React.ReactElement | null {
  const {bottom} = useSafeAreaInsets()
  const bottomDefaultOffset =
    bottom + TAB_BAR_HEIGHT_PX + getTokens().space[5].val
  const {height} = useWindowDimensions()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Stack
      pointerEvents={visible ? 'auto' : 'none'}
      f={1}
      px="$2"
      {...(position === 'top'
        ? {top: topMargin ?? height * 0.1}
        : {bottom: bottomMargin ?? bottomDefaultOffset})}
    >
      <FadeInView directionDown={position === 'top'} visible={visible}>
        <XStack
          ai="center"
          jc={showCloseButton ? 'space-between' : undefined}
          gap="$2"
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
                setToastNotification((prev) => ({...prev, visible: false}))
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
      </FadeInView>
    </Stack>
  )
}

export default ToastNotificationContent
