import {
  DonationThanksHeartGraphic,
  MyDonationsEmptyStateGraphic,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import * as graphicsModule from '@vexl-next/ui/src/assets/graphics'
import {Array, pipe, Record} from 'effect'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const GRAPHIC_SIZE = 120

// Static graphics are listed below; decorative parts have their own screen.
// Everything else must accept the animated graphic props.
const {
  DonationThanksHeartGraphic: _donationThanksHeart,
  MyDonationsEmptyStateGraphic: _myDonationsEmptyState,
  GoldenAvatarBackground: _goldenAvatarBackground,
  GoldenAvatarGlasses: _goldenAvatarGlasses,
  GoldenAvatarShapeFour: _goldenAvatarShapeFour,
  GoldenAvatarShapeOne: _goldenAvatarShapeOne,
  GoldenAvatarShapeThree: _goldenAvatarShapeThree,
  GoldenAvatarShapeTwo: _goldenAvatarShapeTwo,
  GoldenAvatarShimmerStar: _goldenAvatarShimmerStar,
  GraphicHeaderDecoration: _graphicHeaderDecoration,
  ...animatedGraphics
} = graphicsModule

function GraphicTile({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack alignItems="center" gap="$2">
      <YStack
        width={GRAPHIC_SIZE}
        height={GRAPHIC_SIZE}
        alignItems="center"
        justifyContent="center"
      >
        {children}
      </YStack>
      <Typography
        variant="micro"
        color="$foregroundSecondary"
        textAlign="center"
        maxWidth={GRAPHIC_SIZE}
      >
        {label}
      </Typography>
    </YStack>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Animated (tap to replay)">
        <XStack flexWrap="wrap" gap="$4" rowGap="$5">
          {pipe(
            Record.toEntries(animatedGraphics),
            Array.map(([label, Graphic]) => (
              <GraphicTile key={label} label={label}>
                <Graphic animate width={GRAPHIC_SIZE} height={GRAPHIC_SIZE} />
              </GraphicTile>
            ))
          )}
        </XStack>
      </DemoSection>

      <DemoSection title="Static">
        <XStack flexWrap="wrap" gap="$4" rowGap="$5">
          <GraphicTile label="DonationThanksHeartGraphic">
            <DonationThanksHeartGraphic />
          </GraphicTile>
          <GraphicTile label="MyDonationsEmptyStateGraphic">
            <MyDonationsEmptyStateGraphic
              width={GRAPHIC_SIZE}
              height={GRAPHIC_SIZE}
            />
          </GraphicTile>
        </XStack>
      </DemoSection>
    </>
  )
}

export function GraphicsScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Graphics" demos={Demos} />
}
