import React from 'react'

import {YStack} from '../primitives'
import {EmptyState} from './EmptyState'
import {Loader} from './Loader'

export interface LoadErrorStateProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  readonly loading: boolean
  readonly errorMessage?: string
  readonly retryLabel: string
  readonly onRetry: () => void
}

export function LoadErrorState({
  loading,
  errorMessage,
  retryLabel,
  onRetry,
  ...rest
}: LoadErrorStateProps): React.JSX.Element | null {
  if (loading) {
    return (
      <YStack alignItems="center" paddingVertical="$8" {...rest}>
        <Loader size="large" />
      </YStack>
    )
  }

  if (errorMessage === undefined) return null

  return (
    <EmptyState
      description={errorMessage}
      action={{label: retryLabel, onPress: onRetry, variant: 'primary'}}
      {...rest}
    />
  )
}
