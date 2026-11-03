import {Array, pipe} from 'effect'
import React from 'react'

import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export type KeyValueRowSize = 'small' | 'medium'

export interface KeyValueRowProps extends Omit<
  React.ComponentProps<typeof XStack>,
  'children'
> {
  readonly label: string
  readonly value?: string | readonly string[]
  readonly numberOfLines?: number
  readonly size?: KeyValueRowSize
  readonly children?: React.ReactNode
}

export function KeyValueRow({
  label,
  value,
  numberOfLines,
  size = 'small',
  children,
  ...rest
}: KeyValueRowProps): React.JSX.Element {
  const valueVariant =
    size === 'medium' ? 'paragraphDemibold' : 'descriptionBold'
  const lines = typeof value === 'string' ? [value] : (value ?? [])

  return (
    <XStack
      alignItems="flex-start"
      justifyContent="space-between"
      gap="$5"
      {...rest}
    >
      <Typography
        variant={size === 'medium' ? 'paragraph' : 'micro'}
        color="$foregroundSecondary"
        flexShrink={0}
        numberOfLines={1}
      >
        {label}
      </Typography>
      {children ?? (
        <YStack flex={1} gap="$2">
          {pipe(
            lines,
            Array.map((line, i) => (
              <Typography
                key={i}
                variant={valueVariant}
                color="$foregroundPrimary"
                textAlign="right"
                numberOfLines={numberOfLines}
              >
                {i < lines.length - 1 ? `${line},` : line}
              </Typography>
            ))
          )}
        </YStack>
      )}
    </XStack>
  )
}
