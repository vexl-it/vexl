import {Stack, Typography, XStack, YStack, useTheme} from '@vexl-next/ui'
import React, {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {useTranslation} from '../../../utils/localization/I18nProvider'

const dotSize = 22
const dotTravel = 20
const animationDuration = 1000
const fadeDuration = 220

interface Props {
  readonly visible: boolean
  readonly onHidden: () => void
}

function FingertipDot({direction}: {direction: -1 | 1}): React.ReactElement {
  const theme = useTheme()
  const accentColor = theme.accentHighlightSecondary.get()
  const backgroundColor = theme.backgroundPrimary.get()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: animationDuration,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {duration: 250})
      ),
      -1
    )
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.25,
    transform: [
      {translateX: direction * progress.value * dotTravel},
      {scale: 1 + progress.value * 0.12},
    ],
  }))

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: accentColor,
          borderColor: backgroundColor,
          borderWidth: 2,
        },
        animatedStyle,
      ]}
    />
  )
}

export default function PinchZoomHint({
  visible,
  onHidden,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const opacity = useSharedValue(visible ? 1 : 0)

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: fadeDuration,
      easing: Easing.out(Easing.cubic),
    })

    if (visible) return

    const timeoutId = setTimeout(onHidden, fadeDuration)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [onHidden, opacity, visible])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: (1 - opacity.value) * -6}],
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
          left={0}
          right={0}
          bottom={0}
          backgroundColor="$backgroundPrimary"
          opacity={0.86}
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
          {t('map.locationSelect.pinchToAdjustArea')}
        </Typography>
      </YStack>
    </Animated.View>
  )
}
