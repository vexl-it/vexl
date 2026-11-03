import React from 'react'
import {getTokens} from 'tamagui'

import {Stack, YStack} from '../primitives'
import {Backdrop} from './Backdrop'
import {Loader} from './Loader'
import {Typography} from './Typography'

export interface LoadingIndicatorProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  readonly label?: string
}

export function LoadingIndicator({
  label,
  ...rest
}: LoadingIndicatorProps): React.JSX.Element {
  return (
    <YStack alignItems="center" gap="$3" {...rest}>
      <Loader size="medium" />
      {label !== undefined ? (
        <Typography color="$foregroundPrimary" variant="paragraphSmall">
          {label}
        </Typography>
      ) : null}
    </YStack>
  )
}

export interface LoadingOverlayProps extends Omit<
  React.ComponentProps<typeof Stack>,
  'children'
> {
  readonly visible: boolean
  readonly label?: string
}

export function LoadingOverlay({
  visible,
  label,
  ...rest
}: LoadingOverlayProps): React.JSX.Element | null {
  if (!visible) return null

  return (
    <Stack
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      zIndex="$1"
      elevationAndroid={getTokens().zIndex.$1.val}
      alignItems="center"
      justifyContent="center"
      pointerEvents="auto"
      {...rest}
    >
      <Backdrop variant="surface" />
      <LoadingIndicator
        label={label}
        backgroundColor="$backgroundSecondary"
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$4"
      />
    </Stack>
  )
}
