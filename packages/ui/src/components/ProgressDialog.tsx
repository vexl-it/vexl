import React, {useEffect, useRef, useState} from 'react'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import {styled, useTheme} from 'tamagui'
import {Stack, XStack, YStack} from '../primitives'
import {Dialog} from './Dialog'
import {Loader} from './Loader'
import {Typography} from './Typography'

export type ProgressIndication =
  | {type: 'intermediate'}
  | {type: 'loader'}
  | {type: 'progress'; percentage: number}
  | {type: 'done'}

export interface ProgressDialogProps {
  readonly belowProgressLeft?: string
  readonly belowProgressRight?: string
  readonly bottomText?: string
  readonly indicateProgress: ProgressIndication
  readonly title: string
  readonly visible: boolean
}

const ProgressFill = styled(Stack, {
  name: 'ProgressFill',
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  backgroundColor: '$foregroundPrimary',
  borderRadius: '$11',
})

const AnimatedProgressFill = Animated.createAnimatedComponent(ProgressFill)

const ProgressTrack = styled(XStack, {
  name: 'ProgressTrack',
  position: 'relative',
  width: '100%',
  height: 4,
  borderRadius: '$11',
  backgroundColor: '$backgroundTertiary',
  overflow: 'hidden',
})

function percentageFromIndicateProgress(
  indicateProgress: ProgressIndication
): number {
  if (indicateProgress.type === 'intermediate') return 0
  if (indicateProgress.type === 'loader') return 0
  if (indicateProgress.type === 'done') return 100
  return indicateProgress.percentage
}

function IndeterminateProgressBar(): React.JSX.Element {
  const [trackWidth, setTrackWidth] = useState(0)
  const position = useSharedValue(0)

  useEffect(() => {
    position.value = withRepeat(
      withTiming(1, {duration: 1200, easing: Easing.linear}),
      -1
    )

    return () => {
      cancelAnimation(position)
    }
  }, [position])

  const animatedStyle = useAnimatedStyle(() => {
    const fillWidth = trackWidth * 0.35

    return {
      width: fillWidth,
      transform: [
        {
          translateX: position.value * (trackWidth + fillWidth) - fillWidth,
        },
      ],
    }
  })

  return (
    <ProgressTrack
      onLayout={(e) => {
        setTrackWidth(e.nativeEvent.layout.width)
      }}
    >
      <AnimatedProgressFill style={animatedStyle} />
    </ProgressTrack>
  )
}

function ProgressLabels({
  belowProgressLeft,
  belowProgressRight,
}: {
  readonly belowProgressLeft?: string
  readonly belowProgressRight?: string
}): React.JSX.Element {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$2">
      <Typography
        variant="descriptionBold"
        color="$foregroundPrimary"
        flexShrink={0}
      >
        {belowProgressLeft ?? ''}
      </Typography>
      <Typography
        variant="description"
        color="$foregroundSecondary"
        ellipsizeMode="tail"
        flexShrink={1}
        minWidth={0}
        numberOfLines={2}
        textAlign="right"
      >
        {belowProgressRight ?? ''}
      </Typography>
    </XStack>
  )
}

function ProgressIndicator({
  belowProgressLeft,
  belowProgressRight,
  indicateProgress,
}: Pick<
  ProgressDialogProps,
  'belowProgressLeft' | 'belowProgressRight' | 'indicateProgress'
>): React.JSX.Element {
  const theme = useTheme()
  const [trackWidth, setTrackWidth] = useState(0)
  const percentage = percentageFromIndicateProgress(indicateProgress)
  const progress = useSharedValue(percentage)
  const previousPercentage = useRef(percentage)

  useEffect(() => {
    if (percentage < previousPercentage.current) {
      progress.value = percentage
    } else {
      progress.value = withTiming(percentage)
    }
    previousPercentage.current = percentage
  }, [percentage, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    width: (progress.value * trackWidth) / 100,
  }))

  if (indicateProgress.type === 'loader') {
    return (
      <YStack alignItems="center" justifyContent="center" height="$5">
        <Loader size="medium" color={theme.foregroundPrimary.get()} />
      </YStack>
    )
  }

  if (indicateProgress.type === 'intermediate') {
    return (
      <YStack gap="$3">
        <IndeterminateProgressBar />
        <ProgressLabels
          belowProgressLeft={belowProgressLeft}
          belowProgressRight={belowProgressRight}
        />
      </YStack>
    )
  }

  return (
    <YStack gap="$3">
      <ProgressTrack
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width)
        }}
      >
        <AnimatedProgressFill style={animatedStyle} />
      </ProgressTrack>
      <ProgressLabels
        belowProgressLeft={belowProgressLeft}
        belowProgressRight={belowProgressRight}
      />
    </YStack>
  )
}

export function ProgressDialog({
  belowProgressLeft,
  belowProgressRight,
  bottomText,
  indicateProgress,
  title,
  visible,
}: ProgressDialogProps): React.JSX.Element {
  return (
    <Dialog visible={visible}>
      <Typography
        variant="heading2"
        fontWeight="700"
        color="$foregroundPrimary"
      >
        {title}
      </Typography>
      <ProgressIndicator
        belowProgressLeft={belowProgressLeft}
        belowProgressRight={belowProgressRight}
        indicateProgress={indicateProgress}
      />
      {!!bottomText && (
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {bottomText}
        </Typography>
      )}
    </Dialog>
  )
}
