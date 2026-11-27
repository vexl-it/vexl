import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {InfoCircle} from '../icons/InfoCircle'
import {PeopleUsers} from '../icons/PeopleUsers'
import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface ReachLabelProps {
  readonly label: string
  readonly tone?: 'neutral' | 'loss'
  readonly size?: 'small' | 'medium'
}

export function ReachLabel({
  label,
  tone = 'neutral',
  size = 'small',
}: ReachLabelProps): React.JSX.Element {
  const theme = useTheme()
  const iconSize = getTokens().size[size === 'small' ? '$4' : '$5'].val
  const color =
    tone === 'loss'
      ? theme.redForeground.get()
      : theme.foregroundSecondary.get()
  return (
    <XStack ai="center" gap="$2">
      {tone === 'neutral' ? (
        <PeopleUsers size={iconSize} color={color} />
      ) : null}
      <Typography
        variant={size === 'small' ? 'micro' : 'description'}
        color={tone === 'loss' ? '$redForeground' : '$foregroundSecondary'}
        flexShrink={1}
      >
        {label}
      </Typography>
      <InfoCircle size={iconSize} color={color} />
    </XStack>
  )
}
