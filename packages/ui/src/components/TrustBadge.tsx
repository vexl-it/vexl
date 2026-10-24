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

type SizeToken = keyof ReturnType<typeof getTokens>['size']

const CIRCLE_SIZE_TOKENS: Record<TrustBadgeSize, SizeToken> = {
  small: '$3.5',
  medium: '$4.5',
  large: '$5',
  xlarge: '$6',
}

const TICK_TO_CIRCLE_RATIO = 0.75

export function TrustBadge({
  size = 'medium',
  ringColor,
}: TrustBadgeProps): React.JSX.Element {
  const theme = useTheme()
  const {size: sizes} = getTokens()
  const circle = sizes[CIRCLE_SIZE_TOKENS[size]].val
  const ring = ringColor ? 2 * sizes.$1.val : 0
  // The black tick on the yellow accent intentionally does not theme-switch.
  const black = theme.black100.get()
  const badge = (
    <BadgeFrame
      width={circle}
      height={circle}
      backgroundColor="$accentYellowPrimary"
    >
      <Checkmark
        size={circle * TICK_TO_CIRCLE_RATIO}
        color={black}
        stroke={black}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </BadgeFrame>
  )

  return (
    <BadgeFrame
      width={circle + ring}
      height={circle + ring}
      backgroundColor={ringColor}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    >
      {badge}
    </BadgeFrame>
  )
}
