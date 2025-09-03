import React from 'react'
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'
import {runOnJS} from 'react-native-reanimated'
import useSafeGoBack from '../utils/useSafeGoBack'

function GoBackOnSwipeDown({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const goBack = useSafeGoBack()

  return (
    <GestureDetector
      gesture={Gesture.Fling()
        .direction(Directions.DOWN)
        .onEnd(() => {
          runOnJS(goBack)()
        })}
    >
      {children}
    </GestureDetector>
  )
}

export default GoBackOnSwipeDown
