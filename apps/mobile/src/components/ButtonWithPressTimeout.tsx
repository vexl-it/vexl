import Button from './Button'
import {useRef} from 'react'
import {DateTime} from 'luxon'

const DISABLED_DURATION_MILLIS = 1000

function ButtonWithPressTimeout({
  onPress,
  variant,
  ...props
}: React.ComponentProps<typeof Button>): JSX.Element {
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
