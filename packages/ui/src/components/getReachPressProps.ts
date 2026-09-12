import type React from 'react'
import type {XStack} from '../primitives'

export function getReachPressProps(
  onPress: (() => void) | undefined,
  label: string
): React.ComponentProps<typeof XStack> {
  if (!onPress) return {}

  return {
    onPress,
    tabIndex: 0,
    role: 'button',
    'aria-label': label,
    pressStyle: {opacity: 0.7},
  }
}
