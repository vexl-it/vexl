import React, {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {useTheme} from 'tamagui'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const DOT_SIZE = 22
const DOT_TRAVEL = 20
const DOT_BORDER_WIDTH = 2
const PINCH_DURATION_MS = 1000
const PINCH_RESET_DURATION_MS = 250
const FADE_DURATION_MS = 220
const BACKDROP_OPACITY = 0.86

function FingertipDot({
  direction,
}: {
  readonly direction: -1 | 1
}): React.JSX.Element {
  const theme = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: PINCH_DURATION_MS,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0, {duration: PINCH_RESET_DURATION_MS})
        ),
        -1
      )
    )
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.get() * 0.25,
    transform: [
      {translateX: direction * progress.get() * DOT_TRAVEL},
      {scale: 1 + progress.get() * 0.12},
    ],
  }))

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: theme.accentHighlightSecondary.get(),
          borderColor: theme.backgroundPrimary.get(),
          borderWidth: DOT_BORDER_WIDTH,
        },
        animatedStyle,
      ]}
    />
  )
}

export interface PinchZoomHintProps {
  readonly label: string
  readonly visible: boolean
  /** Called once the hide animation finished, so the hint can be unmounted. */
  readonly onHidden: () => void
}

export function PinchZoomHint({
  label,
  visible,
  onHidden,
}: PinchZoomHintProps): React.JSX.Element {
  const opacity = useSharedValue(visible ? 1 : 0)

  useEffect(() => {
    opacity.set(
      withTiming(visible ? 1 : 0, {
        duration: FADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      })
    )

    if (visible) return

    const timeoutId = setTimeout(onHidden, FADE_DURATION_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [onHidden, opacity, visible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{translateY: (1 - opacity.get()) * -6}],
  }))

  return (
    <Animated.View pointerEvents="none" style={animatedStyle}>
      <YStack
        pointerEvents="none"
        alignItems="center"
        gap="$2"
        borderColor="$backgroundSecondary"
        borderRadius="$7"
        borderWidth={1}
        overflow="hidden"
        paddingHorizontal="$4"
        paddingVertical="$3"
      >
        <Stack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          backgroundColor="$backgroundPrimary"
          opacity={BACKDROP_OPACITY}
        />
        <XStack alignItems="center" gap="$8">
          <FingertipDot direction={-1} />
          <FingertipDot direction={1} />
        </XStack>
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {label}
        </Typography>
      </YStack>
    </Animated.View>
  )
}
