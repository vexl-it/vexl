import {Button, Copy, XStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {noop} from '../../shared/noop'

export function CopyAmountButtons(): React.JSX.Element {
  return (
    <XStack flexWrap="wrap" gap="$3">
      {pipe(
        ['BTC', 'SAT', 'CZK'],
        Array.map((label) => (
          <Button
            key={label}
            flex={1}
            icon={Copy}
            size="small"
            variant="secondary"
            onPress={noop}
          >
            {label}
          </Button>
        ))
      )}
    </XStack>
  )
}
