import {Typography} from '@vexl-next/ui'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useAtomValue} from 'jotai'
import React, {useEffect, useState} from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {styled} from 'tamagui'
import {uploadingProgressDataForProgressIndicatorElementAtom} from '../atoms'

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

function percentageFromIndicateProgress(
  indicateProgress:
    | {type: 'intermediate'}
    | {type: 'progress'; percentage: number}
    | {type: 'done'}
): number {
  if (indicateProgress.type === 'intermediate') return 0
  if (indicateProgress.type === 'done') return 100
  return indicateProgress.percentage
}

function ProgressIndicator(): React.JSX.Element {
  const data = useAtomValue(
    uploadingProgressDataForProgressIndicatorElementAtom
  )
  const [trackWidth, setTrackWidth] = useState(0)
  const percentage = percentageFromIndicateProgress(data.indicateProgress)
  const progress = useSharedValue(percentage)

  useEffect(() => {
    progress.value = withTiming(percentage)
  }, [percentage, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    width: (progress.value * trackWidth) / 100,
  }))

  return (
    <YStack gap="$3">
      <XStack
        position="relative"
        width="100%"
        height={4}
        borderRadius="$11"
        backgroundColor="$backgroundTertiary"
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width)
        }}
      >
        <AnimatedProgressFill style={animatedStyle} />
      </XStack>
      <XStack alignItems="center" justifyContent="space-between">
        <Typography variant="descriptionBold" color="$foregroundPrimary">
          {data.belowProgressLeft ?? ''}
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          {data.belowProgressRight ?? ''}
        </Typography>
      </XStack>
    </YStack>
  )
}

export default ProgressIndicator
