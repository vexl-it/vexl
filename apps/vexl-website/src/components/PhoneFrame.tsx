'use client'

import {Typography, YStack} from '@vexl-next/ui'
import React from 'react'

// An iPhone's width in points, so app screens lay out like on a phone
const SCREEN_WIDTH = 375
// Fits laptop screens like 1366x768 together with the sticky header
const SCREEN_HEIGHT = 'min(720px, max(560px, calc(100svh - 200px)))'
const SMALL_SCREEN_HEIGHT = 640

/** A picture of an app screen in a phone bezel. */
export function PhoneFrame({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack alignItems="center" gap="$4" flexShrink={0} className="vexl-phone">
      <YStack
        role="img"
        aria-label={label}
        padding="$3"
        borderRadius="$11"
        backgroundColor="$black100"
        borderWidth={1}
        borderColor="$backgroundTertiary"
        boxShadow="0 32px 64px rgba(0, 0, 0, 0.35)"
      >
        <YStack
          width={SCREEN_WIDTH}
          height={SMALL_SCREEN_HEIGHT}
          $lg={{height: SCREEN_HEIGHT}}
          borderRadius="$9"
          overflow="hidden"
          backgroundColor="$backgroundPrimary"
        >
          {children}
        </YStack>
      </YStack>
      <Typography aria-hidden variant="description" color="$black100">
        {label}
      </Typography>
    </YStack>
  )
}
