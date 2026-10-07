import React from 'react'
import {styled, useTheme} from 'tamagui'

import {Checkmark} from '../icons/Checkmark'
import {Circle, Stack} from '../primitives'

export interface TrustBadgeProps {
  readonly variant?: 'inline' | 'overlay'
  readonly size?: number
  readonly ringColor?: string
  readonly accessibilityLabel?: string
}

const INLINE_SIZE = 14
const OVERLAY_SIZE = 16
const OVERLAY_OFFSET_RATIO = 0.3
const RING_WIDTH = 2

const TrustBadgeFrame = styled(Stack, {
  name: 'TrustBadge',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  pointerEvents: 'none',
})

export function TrustBadge({
  variant = 'inline',
  size,
  ringColor,
  accessibilityLabel,
}: TrustBadgeProps): React.JSX.Element {
  const theme = useTheme()
  const isOverlay = variant === 'overlay'
  const badgeSize = size ?? (isOverlay ? OVERLAY_SIZE : INLINE_SIZE)
  const overlayOffset = isOverlay
    ? -badgeSize * OVERLAY_OFFSET_RATIO
    : undefined
  const isLabeled = accessibilityLabel != null

  return (
    <TrustBadgeFrame
      width={badgeSize}
      height={badgeSize}
      position={isOverlay ? 'absolute' : 'relative'}
      right={overlayOffset}
      bottom={overlayOffset}
      role={isLabeled ? 'img' : undefined}
      aria-label={accessibilityLabel}
      aria-hidden={!isLabeled}
    >
      {isOverlay && ringColor != null ? (
        <Circle
          position="absolute"
          top={-RING_WIDTH}
          left={-RING_WIDTH}
          size={badgeSize + RING_WIDTH * 2}
          backgroundColor={ringColor}
        />
      ) : null}
      <Circle size={badgeSize} backgroundColor="$accentYellowPrimary">
        <Checkmark
          size={badgeSize * 0.72}
          // intentionally not theme-switching - the badge is a black check on
          // the yellow accent in both themes
          color={theme.black100.get()}
        />
      </Circle>
    </TrustBadgeFrame>
  )
}
