import React from 'react'

import {XStack} from '../primitives'
import {Button} from './Button'
import {Loader} from './Loader'
import {Typography} from './Typography'

export interface PriceStatusRowProps extends Omit<
  React.ComponentProps<typeof XStack>,
  'children'
> {
  readonly headline: string
  readonly loading?: boolean
  readonly trailingText?: string
  readonly retryLabel?: string
  readonly onRetry?: () => void
}

export function PriceStatusRow({
  headline,
  loading = false,
  trailingText,
  retryLabel,
  onRetry,
  ...rest
}: PriceStatusRowProps): React.JSX.Element {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      padding="$4"
      gap="$2"
      {...rest}
    >
      <Typography variant="paragraphSmallBold" color="$foregroundSecondary">
        {headline}
      </Typography>
      {onRetry && retryLabel ? (
        <Button variant="secondary" size="small" onPress={onRetry}>
          {retryLabel}
        </Button>
      ) : loading ? (
        <Loader size="small" />
      ) : trailingText ? (
        <Typography variant="micro" color="$foregroundSecondary">
          {trailingText}
        </Typography>
      ) : null}
    </XStack>
  )
}
