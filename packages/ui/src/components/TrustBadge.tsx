import React from 'react'
import {getTokens, styled, useTheme, type ColorTokens} from 'tamagui'

import {Checkmark} from '../icons/Checkmark'
import {Stack} from '../primitives'

export type TrustBadgeSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface TrustBadgeProps {
  readonly size?: TrustBadgeSize
  readonly ringColor?: ColorTokens
}

const BadgeFrame = styled(Stack, {
  name: 'TrustBadge',
  borderRadius: '$11',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

export function TrustBadge({
  size = 'medium',
  ringColor,
}: TrustBadgeProps): React.JSX.Element {
  const SIZES: Record<
    TrustBadgeSize,
    {readonly circle: number; readonly icon: number}
  > = {
    small: {circle: 10, icon: 7},
    medium: {circle: 14, icon: 10},
    large: {circle: getTokens().size.$5.val, icon: 12},
    xlarge: {circle: getTokens().size.$6.val, icon: 15},
  }
  const theme = useTheme()
  const dimensions = SIZES[size]
  // The black tick on the yellow accent intentionally does not theme-switch.
  const black = theme.black100.get()
  const badge = (
    <BadgeFrame
      width={dimensions.circle}
      height={dimensions.circle}
      backgroundColor="$accentYellowPrimary"
    >
      <Checkmark
        size={dimensions.icon}
        color={black}
        stroke={black}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </BadgeFrame>
  )

  return (
    <BadgeFrame
      width={dimensions.circle + (ringColor ? 4 : 0)}
      height={dimensions.circle + (ringColor ? 4 : 0)}
      backgroundColor={ringColor}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    >
      {badge}
    </BadgeFrame>
  )
}
