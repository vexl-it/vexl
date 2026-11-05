'use client'

import {Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'

export function PageHero({
  title,
  text,
  children,
}: {
  readonly title: string
  readonly text?: string
  readonly children?: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack alignItems="center" gap="$5">
      <Image src="/images/glasses-black.webp" alt="" width={46} height={22} />
      <Typography
        tag="h1"
        variant="display"
        color="$foregroundPrimary"
        textAlign="center"
      >
        {title}
      </Typography>
      {text ? (
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textAlign="center"
          maxWidth={640}
        >
          {text}
        </Typography>
      ) : null}
      {children}
    </YStack>
  )
}
