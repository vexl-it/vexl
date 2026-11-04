'use client'

import {YStack} from '@vexl-next/ui'
import React from 'react'
import {Theme} from 'tamagui'

const SCREEN_WIDTH = 320
const SCREEN_HEIGHT = 620

/** App-sized screen in a phone bezel, always in the app's dark theme. */
export function PhoneFrame({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack
      role="group"
      aria-label={label}
      flexShrink={0}
      padding="$3"
      borderRadius="$11"
      backgroundColor="$black100"
      borderWidth={1}
      borderColor="$backgroundTertiary"
      boxShadow="0 32px 64px rgba(0, 0, 0, 0.35)"
    >
      <Theme name="dark">
        <YStack
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          borderRadius="$9"
          overflow="hidden"
          backgroundColor="$backgroundPrimary"
        >
          {children}
        </YStack>
      </Theme>
    </YStack>
  )
}
