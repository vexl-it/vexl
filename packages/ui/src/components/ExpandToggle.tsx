import React from 'react'
import {getTokens, useTheme} from 'tamagui'

import {ChevronDown} from '../icons/ChevronDown'
import {ChevronUp} from '../icons/ChevronUp'
import {XStack} from '../primitives'
import {CountBadge} from './CountBadge'
import {Typography} from './Typography'

export interface ExpandToggleProps {
  readonly label: string
  readonly expanded: boolean
  readonly onToggle: () => void
  readonly count?: number
}

export function ExpandToggle({
  label,
  expanded,
  onToggle,
  count = 0,
}: ExpandToggleProps): React.JSX.Element {
  const theme = useTheme()
  const Chevron = expanded ? ChevronUp : ChevronDown

  return (
    <XStack
      role="button"
      aria-expanded={expanded}
      alignItems="center"
      justifyContent="center"
      gap="$3"
      paddingVertical="$6"
      pressStyle={{opacity: 0.7}}
      onPress={onToggle}
    >
      <XStack alignItems="center" gap="$2">
        <Typography variant="descriptionBold" color="$accentHighlightSecondary">
          {label}
        </Typography>
        {count > 0 ? <CountBadge count={count} /> : null}
      </XStack>
      <Chevron
        color={theme.accentHighlightSecondary.get()}
        size={getTokens().size.$7.val}
      />
    </XStack>
  )
}
