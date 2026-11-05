import {FadeGradient, Stack, Typography, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Swatch({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Stack
      flex={1}
      flexBasis={0}
      height={160}
      borderRadius="$5"
      overflow="hidden"
      backgroundColor="$greenLight"
      justifyContent="center"
      padding="$3"
    >
      {children}
      <Typography variant="micro" color="$foregroundPrimary">
        {label}
      </Typography>
    </Stack>
  )
}

function Demos(): React.JSX.Element {
  return (
    <XStack gap="$3">
      <Swatch label='solidEdge="top"'>
        <FadeGradient solidEdge="top" />
      </Swatch>
      <Swatch label='solidEdge="bottom" solidFraction={0.3}'>
        <FadeGradient solidEdge="bottom" solidFraction={0.3} />
      </Swatch>
    </XStack>
  )
}

export function FadeGradientScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Fade Gradient" demos={Demos} />
}
