import React, {type ReactNode} from 'react'
import {StyleSheet} from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  type BaseAnimationBuilder,
  type EntryExitAnimationFunction,
  type Keyframe,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'

interface Props {
  topMargin: number
  shown?: boolean
  children: ReactNode
  entering?:
    | BaseAnimationBuilder
    | typeof BaseAnimationBuilder
    | EntryExitAnimationFunction
    | Keyframe
  exiting?:
    | BaseAnimationBuilder
    | typeof BaseAnimationBuilder
    | EntryExitAnimationFunction
    | Keyframe
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
  },
})

function AnimatedModal({
  topMargin,
  children,
  exiting,
  entering,
  shown,
}: Props): React.ReactElement | null {
  const {bottom: bottomInset} = useSafeAreaInsets()

  if (shown === false) return null
  return (
    <Animated.View
      entering={entering ? SlideInDown : undefined}
      exiting={exiting ? SlideOutDown : undefined}
      style={[styles.root, {top: topMargin}]}
    >
      <Stack pb={bottomInset} f={1}>
        {children}
      </Stack>
    </Animated.View>
  )
}

export default AnimatedModal
