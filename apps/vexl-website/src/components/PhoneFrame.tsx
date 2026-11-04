'use client'

import {Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {Theme} from 'tamagui'

const SCREEN_WIDTH = 320
const SCREEN_HEIGHT = 620
// Shorter on phones, so the step text above stays in view while tapping
const SMALL_SCREEN_HEIGHT = 540

/** App-sized screen in a phone bezel, always in the app's dark theme. */
export function PhoneFrame({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack alignItems="center" gap="$4" flexShrink={0}>
      <XStack
        aria-hidden
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderRadius="$11"
        backgroundColor="$black100"
      >
        <Typography variant="description" color="$white100">
          {label}
        </Typography>
      </XStack>
      <YStack
        role="group"
        aria-label={label}
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
            height={SMALL_SCREEN_HEIGHT}
            $lg={{height: SCREEN_HEIGHT}}
            borderRadius="$9"
            overflow="hidden"
            backgroundColor="$backgroundPrimary"
          >
            {children}
          </YStack>
        </Theme>
      </YStack>
    </YStack>
  )
}
