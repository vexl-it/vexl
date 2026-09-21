import React from 'react'
import {useTheme} from 'tamagui'

import {ClockTime} from '../icons/ClockTime'
import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface DisappearingMessagesIndicatorProps {
  readonly duration: string
  readonly accessibilityLabel: string
  readonly textVariant?: 'micro' | 'description'
}

export function DisappearingMessagesIndicator({
  duration,
  accessibilityLabel,
  textVariant = 'description',
}: DisappearingMessagesIndicatorProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <XStack
      alignItems="center"
      gap="$1"
      flexShrink={0}
      tabIndex={0}
      aria-label={accessibilityLabel}
    >
      <ClockTime size={16} color={theme.foregroundSecondary.get()} />
      <Typography variant={textVariant} color="$foregroundSecondary">
        {duration}
      </Typography>
    </XStack>
  )
}
