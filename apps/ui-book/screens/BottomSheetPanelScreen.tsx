import {
  BottomSheetPanel,
  Button,
  Stack,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack backgroundColor="$greenLight" borderRadius="$5" overflow="hidden">
      <Stack height={120} />
      <BottomSheetPanel>
        <Typography variant="paragraphSmall" color="$foregroundPrimary">
          Content sits on a top-rounded panel above the map.
        </Typography>
        <Button>Save</Button>
      </BottomSheetPanel>
    </YStack>
  )
}

export function BottomSheetPanelScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Bottom Sheet Panel" demos={Demos} />
}
