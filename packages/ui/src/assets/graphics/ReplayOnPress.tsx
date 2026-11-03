import type {ReactNode} from 'react'
import React, {useState} from 'react'
import {Pressable} from 'react-native'

/**
 * Replays an animated graphic on tap. The press handler lives on a Pressable
 * around the Svg because Svg press props are not supported on web.
 */
export function ReplayOnPress({
  animate,
  disabled,
  width,
  height,
  children,
}: {
  readonly animate: boolean
  readonly disabled: boolean
  readonly width: number
  readonly height: number
  readonly children: (trigger: number) => ReactNode
}): React.JSX.Element {
  const [trigger, setTrigger] = useState(0)

  if (!animate || disabled) return <>{children(trigger)}</>

  return (
    <Pressable
      accessible={false}
      style={{width, height}}
      onPress={() => {
        setTrigger((current) => current + 1)
      }}
    >
      {children(trigger)}
    </Pressable>
  )
}
