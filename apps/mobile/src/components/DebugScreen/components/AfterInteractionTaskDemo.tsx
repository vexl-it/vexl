import {hmac} from '@vexl-next/cryptography'
import {Button, Stack, Typography, XStack, YStack} from '@vexl-next/ui'
import {type Task} from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import React, {useCallback, useEffect, useState} from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import formatNumber from '../../../utils/formatNumber'
import sequenceTasksWithAnimationFrames from '../../../utils/sequenceTasksWithAnimationFrames'

const AnimatedProgressFill = Animated.createAnimatedComponent(Stack)

function ProgressIndicator({
  percentDone,
}: {
  readonly percentDone: number
}): React.ReactElement {
  const [trackWidth, setTrackWidth] = useState(0)
  const progress = useSharedValue(percentDone)

  useEffect(() => {
    progress.value = withTiming(percentDone)
  }, [percentDone, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    width: (progress.value * trackWidth) / 100,
  }))

  return (
    <XStack
      position="relative"
      width="100%"
      height={4}
      borderRadius="$11"
      backgroundColor="$backgroundTertiary"
      overflow="hidden"
      onLayout={(event) => {
        setTrackWidth(event.nativeEvent.layout.width)
      }}
    >
      <AnimatedProgressFill
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        backgroundColor="$foregroundPrimary"
        borderRadius="$11"
        style={animatedStyle}
      />
    </XStack>
  )
}

// sleep promise
function sleepPromise(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

function createIntensiveTasks(
  onProgress: (progress: number) => void = () => {}
): Array<Task<string>> {
  return Array(10000)
    .fill('ahojTotojetest')
    .map((input, i, array) => {
      return async () => {
        const result = hmac.hmacSign({
          data: input,
          password: 'ahoj',
        })
        onProgress((i + 1) / array.length)
        return result
      }
    })
}

export default function AfterInteractionTaskDemo(): React.ReactElement {
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | undefined>(undefined)

  const runTask = useCallback(() => {
    void (async () => {
      setProgress(0)
      setResult(undefined)
      await sleepPromise(1000)
      const startAt = Date.now()
      const result = await pipe(
        createIntensiveTasks(),
        sequenceTasksWithAnimationFrames(500, (progress) => {
          setProgress(progress)
        })
      )()
      setResult(
        `Done. Got ${result.length} items. Took ${formatNumber(
          Date.now() - startAt
        )}ms`
      )
    })()
  }, [])

  return (
    <YStack gap="$2" my="$2">
      <Typography variant="paragraphSmall" color="$foregroundPrimary">
        Test extensive calculation that updates UI. (Calculating 2000 hmacs)
      </Typography>
      <Button size="small" variant="secondary" onPress={runTask}>
        run
      </Button>
      <ProgressIndicator percentDone={progress * 100} />
      {!result ? (
        <Typography variant="description" color="$foregroundPrimary">
          {Math.round(progress * 100)}
        </Typography>
      ) : (
        <Typography variant="description" color="$foregroundPrimary">
          {result}
        </Typography>
      )}
    </YStack>
  )
}
