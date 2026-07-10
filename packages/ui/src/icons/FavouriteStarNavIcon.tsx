import React, {useEffect, useRef} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {getTokens, Stack, useTheme} from 'tamagui'

import {StarFilled} from './StarFilled'
import {StarOutline} from './StarOutline'
import {type IconProps} from './types'

const EASING = Easing.bezier(0.25, 0.25, 0.75, 0.75)
const OUTLINE_SCALE_OUT = 9.491476694742838
const FILLED_SCALE_IN_START = 7.083432515462239
const FILLED_SCALE_OUT = 5.864198048909504
const tokens = getTokens()
const DEFAULT_ICON_SIZE = tokens.size.$7.val
const ANIMATION_SIZE = tokens.size.$9.val

export interface FavouriteStarNavIconProps extends IconProps {
  readonly isFavourite: boolean
}

export function FavouriteStarNavIcon({
  color,
  isFavourite,
  size = DEFAULT_ICON_SIZE,
  testID,
}: FavouriteStarNavIconProps): React.JSX.Element {
  const theme = useTheme()
  const previousFavouriteRef = useRef(isFavourite)
  const iconColor =
    typeof color === 'string' ? color : theme.foregroundPrimary.get()
  const outlineOpacity = useSharedValue(isFavourite ? 0 : 1)
  const outlineScale = useSharedValue(isFavourite ? 0 : 1)
  const filledOpacity = useSharedValue(isFavourite ? 1 : 0)
  const filledScale = useSharedValue(isFavourite ? 1 : 0)
  const iconOffset = (ANIMATION_SIZE - size) / 2

  useEffect(() => {
    if (previousFavouriteRef.current === isFavourite) {
      return
    }

    previousFavouriteRef.current = isFavourite

    if (isFavourite) {
      outlineOpacity.set(withTiming(0, {duration: 250, easing: EASING}))
      outlineScale.set(
        withSequence(
          withTiming(OUTLINE_SCALE_OUT, {duration: 250, easing: EASING}),
          withTiming(0, {duration: 200, easing: EASING})
        )
      )
      filledOpacity.set(0)
      filledOpacity.set(withDelay(250, withTiming(1, {duration: 150})))
      filledScale.set(FILLED_SCALE_IN_START)
      filledScale.set(
        withDelay(
          250,
          withSequence(
            withTiming(0.8, {duration: 150, easing: EASING}),
            withTiming(1, {duration: 50, easing: EASING})
          )
        )
      )
    } else {
      filledOpacity.set(1)
      filledOpacity.set(withDelay(100, withTiming(0, {duration: 1})))
      filledScale.set(
        withSequence(
          withTiming(FILLED_SCALE_OUT, {duration: 100, easing: EASING}),
          withTiming(0, {duration: 1, easing: EASING})
        )
      )
      outlineOpacity.set(0)
      outlineScale.set(0)
      outlineOpacity.set(withDelay(100, withTiming(1, {duration: 150})))
      outlineScale.set(
        withDelay(
          100,
          withSequence(
            withTiming(1.2, {duration: 150, easing: EASING}),
            withTiming(1, {duration: 50, easing: EASING})
          )
        )
      )
    }
  }, [filledOpacity, filledScale, isFavourite, outlineOpacity, outlineScale])

  const outlineStyle = useAnimatedStyle(() => ({
    opacity: outlineOpacity.get(),
    transform: [{scale: outlineScale.get()}],
  }))

  const filledStyle = useAnimatedStyle(() => ({
    opacity: filledOpacity.get(),
    transform: [{scale: filledScale.get()}],
  }))

  return (
    <Stack
      width={ANIMATION_SIZE}
      height={ANIMATION_SIZE}
      borderRadius="$3"
      overflow="hidden"
      testID={testID}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: iconOffset,
            top: iconOffset,
          },
          outlineStyle,
        ]}
      >
        <StarOutline size={size} color={iconColor} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: iconOffset,
            top: iconOffset,
          },
          filledStyle,
        ]}
      >
        <StarFilled size={size} color={iconColor} />
      </Animated.View>
    </Stack>
  )
}
