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

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

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
    <>
      <DemoSection title="MapPin and RadiusRing">
        <XStack gap="$5" alignItems="center">
          <MapPin color={accent} />
          <RadiusRing color={accent} size={120} />
        </XStack>
      </DemoSection>

      <DemoSection title="MapLabelPill">
        <YStack gap="$3" padding="$3" backgroundColor="$greenLight">
          <MapLabelPill label="Václavské náměstí, Praha" />
          <MapLabelPill label="Praha 1" detail="Radius: 2 km" />
          <MapLabelPill label="Location not found" error />
          <MapLabelPill label="" loading />
          <MapLabelPill
            variant="highlight"
            label="Move the map to pick a spot"
          />
          <MapLabelPill variant="highlight" label="" loading />
        </YStack>
      </DemoSection>

      <DemoSection title="MapOverlayLayout with a centered pin">
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
      </DemoSection>

      <DemoSection title="PinchZoomHint">
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
      </DemoSection>
    </>
  )
}

export function MapOverlayScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Map Overlay" demos={Demos} />
}
