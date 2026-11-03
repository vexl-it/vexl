import React from 'react'

import {disabledOpacity} from '../config/tokens'
import {XStack, YStack} from '../primitives'
import {Button} from './Button'
import {Typography} from './Typography'

export interface DateSlotsSummaryRowAction {
  readonly label: string
  readonly onPress: () => void
}

export interface DateSlotsSummaryRowProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  readonly weekday: string
  readonly label: string
  readonly caption?: string
  readonly value?: string
  /** Replaces caption and value on the right side. */
  readonly action?: DateSlotsSummaryRowAction
  readonly outdated?: boolean
  readonly onPress?: () => void
  /** Content shown below the summary inside the same card, e.g. a slot picker. */
  readonly children?: React.ReactNode
}

export function DateSlotsSummaryRow({
  weekday,
  label,
  caption,
  value,
  action,
  outdated = false,
  onPress,
  children,
  ...rest
}: DateSlotsSummaryRowProps): React.JSX.Element {
  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      padding="$5"
      opacity={outdated ? disabledOpacity : 1}
      {...rest}
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
        role={onPress ? 'button' : undefined}
        disabled={outdated || !onPress}
        onPress={onPress}
        pressStyle={{opacity: 0.7}}
      >
        <YStack flex={1} gap="$2">
          <Typography variant="micro" color="$foregroundSecondary">
            {weekday}
          </Typography>
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            {label}
          </Typography>
        </YStack>
        {action ? (
          <Button variant="link" size="small" onPress={action.onPress}>
            {action.label}
          </Button>
        ) : caption !== undefined || value !== undefined ? (
          <YStack alignItems="flex-end" gap="$2" maxWidth="45%" flexShrink={1}>
            {caption !== undefined ? (
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                textAlign="right"
              >
                {caption}
              </Typography>
            ) : null}
            {value !== undefined ? (
              <Typography
                variant="descriptionBold"
                color="$accentHighlightSecondary"
                textAlign="right"
                numberOfLines={2}
              >
                {value}
              </Typography>
            ) : null}
          </YStack>
        ) : null}
      </XStack>
      {children}
    </YStack>
  )
}
