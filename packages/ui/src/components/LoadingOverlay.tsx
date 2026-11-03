import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {Stack, YStack} from '../primitives'
import {Backdrop} from './Backdrop'
import {DotTypingIndicator} from './DotTypingIndicator'
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
  const theme = useTheme()

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
      <Backdrop variant="dark" />
      <YStack alignItems="center" gap="$6">
        <DotTypingIndicator
          size="large"
          color={theme.accentYellowPrimary.get()}
        />
        {label !== undefined ? (
          <Typography color="$white100" variant="paragraphSmallBold">
            {label}
          </Typography>
        ) : null}
      </YStack>
    </Stack>
  )
}
