import React, {useEffect} from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {getTokens} from 'tamagui'

import {
  MarketplaceLoaderCircle,
  MarketplaceLoaderRibbon,
  MarketplaceLoaderSquare,
} from '../assets/marketplaceLoader'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const STEP_DURATION_MS = 620
const ELEMENT_COUNT = 3
const STEP_COUNT = ELEMENT_COUNT * 2
const STEP_MOVE_PORTION = 0.62
const ROTATION_DEGREES = 90

function getStepMotionProgress(stepProgress: number): number {
  'worklet'

  if (stepProgress >= STEP_MOVE_PORTION) return 1

  return stepProgress / STEP_MOVE_PORTION
}

function easeOutBack(progress: number): number {
  'worklet'

  const c1 = 1.70158
  const c3 = c1 + 1

  return 1 + c3 * (progress - 1) ** 3 + c1 * (progress - 1) ** 2
}

function getDynamicRotationProgress(stepProgress: number): number {
  'worklet'

  return easeOutBack(getStepMotionProgress(stepProgress))
}

function getElementRotation(progress: number, elementIndex: number): number {
  'worklet'

  const activeStep = Math.floor(progress)
  const stepProgress = progress - activeStep
  const resetStep = elementIndex + ELEMENT_COUNT

  if (activeStep < elementIndex) return 0
  if (activeStep === elementIndex) {
    return getDynamicRotationProgress(stepProgress) * ROTATION_DEGREES
  }

  if (activeStep < resetStep) return ROTATION_DEGREES
  if (activeStep === resetStep) {
    return (
      ROTATION_DEGREES -
      getDynamicRotationProgress(stepProgress) * ROTATION_DEGREES
    )
  }

  return 0
}

function getElementScale(progress: number, elementIndex: number): number {
  'worklet'

  const activeStep = Math.floor(progress)
  const resetStep = elementIndex + ELEMENT_COUNT

  if (activeStep !== elementIndex && activeStep !== resetStep) return 1

  const stepProgress = progress - activeStep
  if (stepProgress >= STEP_MOVE_PORTION) return 1

  return 1 + Math.sin(getStepMotionProgress(stepProgress) * Math.PI) * 0.08
}

function AnimatedLoaderElement({
  children,
  elementIndex,
}: {
  readonly children: React.ReactNode
  readonly elementIndex: number
}): React.JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(STEP_COUNT, {
        duration: STEP_COUNT * STEP_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    )
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {rotate: `${getElementRotation(progress.value, elementIndex)}deg`},
      {scale: getElementScale(progress.value, elementIndex)},
    ],
  }))

  return (
    <Animated.View
      style={[
        {
          height: getTokens().size.$10.val,
          width: getTokens().size.$10.val,
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  )
}

export interface MarketplaceEmptyLoaderProps {
  readonly label: string
}

export function MarketplaceEmptyLoader({
  label,
}: MarketplaceEmptyLoaderProps): React.JSX.Element {
  return (
    <YStack
      alignItems="center"
      justifyContent="center"
      gap="$7"
      minHeight={getTokens().size.$13.val * 5}
      paddingHorizontal="$5"
      width="100%"
    >
      <XStack alignItems="center" gap="$5">
        <AnimatedLoaderElement elementIndex={0}>
          <MarketplaceLoaderCircle size={getTokens().size.$10.val} />
        </AnimatedLoaderElement>
        <AnimatedLoaderElement elementIndex={1}>
          <MarketplaceLoaderSquare size={getTokens().size.$10.val} />
        </AnimatedLoaderElement>
        <AnimatedLoaderElement elementIndex={2}>
          <MarketplaceLoaderRibbon size={getTokens().size.$10.val} />
        </AnimatedLoaderElement>
      </XStack>
      <Stack paddingVertical="$3">
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="center"
          fontWeight="700"
        >
          {label}
        </Typography>
      </Stack>
    </YStack>
  )
}
