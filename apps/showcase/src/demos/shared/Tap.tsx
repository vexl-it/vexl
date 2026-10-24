import {Stack} from '@vexl-next/ui'
import {useState, type ComponentProps} from 'react'

/** A press target that shows a touch when `on` turns true, but not when it mounts already on (after a seek). */
export function Tap({
  on,
  children,
  ...props
}: {on: boolean} & ComponentProps<typeof Stack>): React.JSX.Element {
  const [armed, setArmed] = useState(!on)
  if (!on && !armed) setArmed(true)
  const touched = on && armed
  return (
    <Stack
      position="relative"
      className={touched ? 'demo-press' : ''}
      {...props}
    >
      {children}
      {touched ? (
        <Stack
          className="demo-tap"
          position="absolute"
          top="50%"
          left="50%"
          width="$11"
          height="$11"
          borderRadius="$11"
          borderWidth={2}
          borderColor="$white100"
          backgroundColor="$foregroundSecondary"
        />
      ) : null}
    </Stack>
  )
}
