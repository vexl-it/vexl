import {
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {useRef} from 'react'
import {Pressable, type StyleProp, type ViewStyle} from 'react-native'

const TOUCH_DELAY_MS = 500

function SecretDoor({
  style,
  children,
  onSecretDoorOpen,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
  onSecretDoorOpen: () => void
}): JSX.Element {
  const pressState = useRef<{
    lastPress: UnixMilliseconds
    counter: number
  }>({lastPress: unixMillisecondsNow(), counter: 0})

  return (
    <Pressable
      style={style}
      onPress={() => {
        const pressStateCurrent = pressState.current
        const now = unixMillisecondsNow()

        if (now - pressStateCurrent.lastPress > TOUCH_DELAY_MS) {
          pressStateCurrent.lastPress = now
          pressStateCurrent.counter = 0
        } else {
          pressStateCurrent.lastPress = now
          pressStateCurrent.counter += 1
        }

        if (pressStateCurrent.counter > 5) {
          pressStateCurrent.counter = 0
          onSecretDoorOpen()
        }
      }}
    >
      {children}
    </Pressable>
  )
}

export default SecretDoor
