import {
  GoldenAvatarBackground,
  GoldenAvatarGlasses,
  GoldenAvatarShapeFour,
  GoldenAvatarShapeOne,
  GoldenAvatarShapeThree,
  GoldenAvatarShapeTwo,
  GoldenAvatarShimmerStar,
  GraphicHeaderDecoration,
  Stack,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const AVATAR_SIZE = 150

function Layer({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Stack position="absolute" top={0} left={0}>
      {children}
    </Stack>
  )
}

function Demos(): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack gap="$4">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        GraphicHeaderDecoration
      </Typography>
      <Stack
        height={145}
        borderRadius="$5"
        overflow="hidden"
        backgroundColor="$backgroundSecondary"
      >
        <GraphicHeaderDecoration />
      </Stack>

      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Golden avatar parts (composed)
      </Typography>
      <XStack gap="$4" alignItems="center">
        <Stack width={AVATAR_SIZE} height={AVATAR_SIZE}>
          <Layer>
            <GoldenAvatarBackground />
          </Layer>
          <Layer>
            <GoldenAvatarShapeOne color={theme.greenForeground.get()} />
          </Layer>
          <Layer>
            <GoldenAvatarShapeTwo color={theme.accentYellowPrimary.get()} />
          </Layer>
          <Layer>
            <GoldenAvatarShapeThree color={theme.pinkForeground.get()} />
          </Layer>
          <Layer>
            <GoldenAvatarShapeFour color={theme.redForeground.get()} />
          </Layer>
          <Layer>
            <GoldenAvatarGlasses lensColor={theme.accentYellowPrimary.get()} />
          </Layer>
        </Stack>
        <Stack backgroundColor="$black100" borderRadius="$3" padding="$3">
          <GoldenAvatarShimmerStar />
        </Stack>
      </XStack>
    </YStack>
  )
}

export function DecorativeGraphicsScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Decorative Graphics" demos={Demos} />
}
