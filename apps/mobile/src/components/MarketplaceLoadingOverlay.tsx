import {Loader, Typography} from '@vexl-next/ui'
import {Stack, YStack} from '@vexl-next/ui/src/primitives'
import React from 'react'
import {getTokens} from 'tamagui'

const LOADING_OVERLAY_LAYER = getTokens().zIndex.$1.val

interface Props {
  readonly label: string
  readonly top?: number
  readonly visible: boolean
}

function MarketplaceLoadingOverlay({
  label,
  top = 0,
  visible,
}: Props): React.JSX.Element | null {
  if (!visible) return null

  return (
    <Stack
      position="absolute"
      top={top}
      right={0}
      bottom={0}
      left={0}
      zIndex={LOADING_OVERLAY_LAYER}
      elevationAndroid={LOADING_OVERLAY_LAYER}
      alignItems="center"
      justifyContent="center"
      pointerEvents="auto"
    >
      <Stack
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        backgroundColor="$backgroundPrimary"
        opacity={0.78}
      />
      <YStack
        alignItems="center"
        gap="$3"
        backgroundColor="$backgroundSecondary"
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$4"
      >
        <Loader size="medium" />
        <Typography color="$foregroundPrimary" variant="paragraphSmall">
          {label}
        </Typography>
      </YStack>
    </Stack>
  )
}

export default MarketplaceLoadingOverlay
