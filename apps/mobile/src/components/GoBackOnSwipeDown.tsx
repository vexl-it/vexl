import React from 'react'
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'
import {scheduleOnRN} from 'react-native-worklets'
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
          scheduleOnRN(goBack)
        })}
    >
      {children}
    </GestureDetector>
  )
}

export default GoBackOnSwipeDown
