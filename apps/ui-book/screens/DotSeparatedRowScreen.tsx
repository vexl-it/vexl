import {DotSeparatedRow, Typography, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <DotSeparatedRow>
        <Typography variant="micro" color="$foregroundSecondary">
          Prague club
        </Typography>
        <Typography variant="micro" color="$foregroundSecondary">
          3 common friends
        </Typography>
      </DotSeparatedRow>
      <DotSeparatedRow flexWrap="wrap">
        {['Up to 10 000 CZK', 'Cash', 'Prague', 'Brno', 'Ostrava'].map(
          (item) => (
            <Typography
              key={item}
              variant="description"
              color="$foregroundSecondary"
            >
              {item}
            </Typography>
          )
        )}
      </DotSeparatedRow>
    </YStack>
  )
}

export function DotSeparatedRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Dot Separated Row" demos={Demos} />
}
