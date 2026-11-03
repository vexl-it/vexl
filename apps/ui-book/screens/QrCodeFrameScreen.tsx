import {
  Backdrop,
  getTokens,
  QrCodeFrame,
  Rejected,
  Typography,
  useTheme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const QR_VALUE = 'https://vexl.it'

function ExpiredOverlay(): React.JSX.Element {
  const theme = useTheme()

  return (
    <>
      <Backdrop variant="surface" borderRadius="$3" />
      <YStack
        position="absolute"
        padding="$5"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
        alignItems="center"
        gap="$3"
      >
        <Rejected
          size={getTokens().size.$10.val}
          color={theme.accentHighlightPrimary.get()}
        />
        <Typography variant="paragraphDemibold" color="$accentHighlightPrimary">
          Expired
        </Typography>
      </YStack>
    </>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Default
      </Typography>
      <QrCodeFrame value={QR_VALUE} size={200} />
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        With overlay
      </Typography>
      <QrCodeFrame value={QR_VALUE} size={200} overlay={<ExpiredOverlay />} />
    </YStack>
  )
}

export function QrCodeFrameScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="QR Code Frame" demos={Demos} />
}
