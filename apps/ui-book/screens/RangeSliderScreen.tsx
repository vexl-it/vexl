import {RangeSlider, Typography, YStack} from '@vexl-next/ui'
import {atom, useAtomValue} from 'jotai'
import React, {useMemo} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const minValueAtom = useMemo(() => atom(250), [])
  const maxValueAtom = useMemo(() => atom(7500), [])
  const minValue = useAtomValue(minValueAtom)
  const maxValue = useAtomValue(maxValueAtom)

  return (
    <YStack gap="$4">
      <Typography variant="description" color="$foregroundSecondary">
        Selected range: {minValue.toLocaleString()} –{' '}
        {maxValue.toLocaleString()}
      </Typography>
      <RangeSlider
        minValueAtom={minValueAtom}
        maxValueAtom={maxValueAtom}
        maxLimit={10000}
      />
    </YStack>
  )
}

export function RangeSliderScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Range Slider" demos={Demos} />
}
