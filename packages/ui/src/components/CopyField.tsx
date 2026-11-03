import React from 'react'

import {Copy} from '../icons/Copy'
import {XStack, YStack} from '../primitives'
import {NavButton} from './NavButton'
import {Typography} from './Typography'

export interface CopyFieldProps extends Omit<
  React.ComponentProps<typeof XStack>,
  'children'
> {
  readonly value: string
  readonly onCopy: () => void
  readonly label?: string
  readonly copyAccessibilityLabel?: string
  readonly disabled?: boolean
}

export function CopyField({
  value,
  onCopy,
  label,
  copyAccessibilityLabel,
  disabled = false,
  ...rest
}: CopyFieldProps): React.JSX.Element {
  return (
    <XStack
      alignItems="center"
      gap="$3"
      minHeight="$12"
      paddingLeft="$4"
      paddingRight="$3"
      paddingVertical="$3"
      borderRadius="$4"
      backgroundColor="$backgroundSecondary"
      {...rest}
    >
      <YStack flex={1} gap="$1">
        {label !== undefined ? (
          <Typography
            variant="micro"
            color="$foregroundSecondary"
            numberOfLines={1}
          >
            {label}
          </Typography>
        ) : null}
        <Typography
          variant="paragraphSmall"
          color="$foregroundPrimary"
          numberOfLines={1}
        >
          {value}
        </Typography>
      </YStack>
      <NavButton
        variant="normal"
        icon={Copy}
        aria-label={copyAccessibilityLabel}
        disabled={disabled}
        onPress={onCopy}
      />
    </XStack>
  )
}
