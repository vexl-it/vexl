import {
  Button,
  MapLabelPill,
  MapOverlayLayout,
  MapPin,
  mapPinTipTransform,
  PinchZoomHint,
  RadiusRing,
  Stack,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <Typography variant="micro" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

function FakeMap({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Stack
      height={320}
      borderRadius="$5"
      overflow="hidden"
      backgroundColor="$greenLight"
    >
      {children}
    </Stack>
  )
}

function Demos(): React.JSX.Element {
  const theme = useTheme()
  const accent = theme.accentHighlightSecondary.get()
  const [hintVisible, setHintVisible] = useState(true)
  const [hintMounted, setHintMounted] = useState(true)

  return (
    <YStack gap="$4">
      <SectionLabel>MapPin and RadiusRing</SectionLabel>
      <XStack gap="$5" alignItems="center">
        <MapPin color={accent} />
        <RadiusRing color={accent} size={120} />
      </XStack>

      <SectionLabel>MapLabelPill</SectionLabel>
      <YStack gap="$3" padding="$3" backgroundColor="$greenLight">
        <MapLabelPill label="Václavské náměstí, Praha" />
        <MapLabelPill label="Praha 1" detail="Radius: 2 km" />
        <MapLabelPill label="Location not found" error />
        <MapLabelPill label="" loading />
        <MapLabelPill variant="highlight" label="Move the map to pick a spot" />
        <MapLabelPill variant="highlight" label="" loading />
      </YStack>

      <SectionLabel>MapOverlayLayout with a centered pin</SectionLabel>
      <FakeMap>
        <Stack
          position="absolute"
          top="50%"
          left="50%"
          transform={mapPinTipTransform}
        >
          <MapPin color={accent} />
        </Stack>
        <MapOverlayLayout
          fillSafeArea={false}
          top={
            <Stack padding="$3" backgroundColor="$backgroundPrimary">
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
              >
                Top slot
              </Typography>
            </Stack>
          }
          middle={<MapLabelPill label="Middle slot" />}
          bottom={
            <Stack padding="$3">
              <Button>Bottom slot</Button>
            </Stack>
          }
        />
      </FakeMap>

      <SectionLabel>PinchZoomHint</SectionLabel>
      <Stack padding="$5" alignItems="center" backgroundColor="$greenLight">
        {hintMounted ? (
          <PinchZoomHint
            label="Pinch to adjust the area"
            visible={hintVisible}
            onHidden={() => {
              setHintMounted(false)
            }}
          />
        ) : null}
      </Stack>
      <Button
        variant="secondary"
        size="small"
        onPress={() => {
          const show = !hintMounted
          setHintMounted(true)
          setHintVisible(show)
        }}
      >
        Toggle hint
      </Button>
    </YStack>
  )
}

export function MapOverlayScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Map Overlay" demos={Demos} />
}
