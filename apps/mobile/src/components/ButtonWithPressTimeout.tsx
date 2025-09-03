import {DateTime} from 'luxon'
import React, {useRef} from 'react'
import Button from './Button'

const DISABLED_DURATION_MILLIS = 1000

function ButtonWithPressTimeout({
  onPress,
  variant,
  ...props
}: React.ComponentProps<typeof Button>): React.ReactElement {
  const lastPressedTimestampRef = useRef<DateTime | undefined>(undefined)

  function handleButtonPress(): void {
    if (
      !lastPressedTimestampRef.current ||
      DateTime.now().toMillis() - lastPressedTimestampRef.current.toMillis() >
        DISABLED_DURATION_MILLIS
    ) {
      onPress()
      lastPressedTimestampRef.current = DateTime.now()
    }
  }

  return <Button onPress={handleButtonPress} variant={variant} {...props} />
}

export default ButtonWithPressTimeout
