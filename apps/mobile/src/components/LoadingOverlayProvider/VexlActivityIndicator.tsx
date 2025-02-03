import {useEffect, useMemo} from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {Stack, type StackProps, Text, XStack, YStack} from 'tamagui'

interface Props extends StackProps {
  size: 'small' | 'medium' | 'large'
  description?: string
}

function DotObject({size, ...props}: Props): JSX.Element {
  const dimensions = useMemo(() => {
    switch (size) {
      case 'small':
        return 6
      case 'medium':
        return 9
      case 'large':
        return 12
      default:
        return 0
    }
  }, [size])

  return (
    <Stack
      height={dimensions}
      width={dimensions}
      borderRadius={dimensions}
      bc="$white"
      {...props}
    />
  )
}

function VexlActivityIndicator({
  description,
  size,
  ...props
}: Props): JSX.Element {
  const translateY1 = useSharedValue(0)
  const translateY2 = useSharedValue(0)
  const translateY3 = useSharedValue(0)
  const transitionValue = size === 'large' ? 15 : size === 'medium' ? 10 : 5

  useEffect(() => {
    translateY1.value = withRepeat(
      withSequence(
        withTiming(-transitionValue, {duration: 500}),
        withTiming(transitionValue, {duration: 800})
      ),
      -1,
      true
    )

    translateY2.value = withRepeat(
      withSequence(
        withTiming(-transitionValue, {duration: 700}),
        withTiming(transitionValue, {duration: 600})
      ),
      -1,
      true
    )

    translateY3.value = withRepeat(
      withSequence(
        withTiming(-transitionValue, {duration: 900}),
        withTiming(transitionValue, {duration: 400})
      ),
      -1,
      true
    )
  }, [transitionValue, translateY1, translateY2, translateY3])

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{translateY: translateY1.value}],
  }))

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{translateY: translateY2.value}],
  }))

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{translateY: translateY3.value}],
  }))

  return (
    <YStack ai="center" gap={size === 'large' ? '$6' : '$4'}>
      <XStack ai="center" gap={size === 'large' ? '$2' : '$1'}>
        <Animated.View style={animatedStyle1}>
          <DotObject size={size} {...props} />
        </Animated.View>
        <Animated.View style={animatedStyle2}>
          <DotObject size={size} {...props} />
        </Animated.View>
        <Animated.View style={animatedStyle3}>
          <DotObject size={size} {...props} />
        </Animated.View>
      </XStack>
      {!!description && (
        <Text fos={size === 'large' ? 14 : 12} ff="$body500" col="$grey">
          {description}
        </Text>
      )}
    </YStack>
  )
}

export default VexlActivityIndicator
