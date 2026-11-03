import {LocationSuggestionRow, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack>
      <LocationSuggestionRow
        title="Praha 1"
        subtitle="Hlavní město Praha, Czechia"
        onPress={() => {}}
      />
      <LocationSuggestionRow title="Brno" onPress={() => {}} />
      <LocationSuggestionRow
        title="A very long location name that wraps onto a second line"
        subtitle="Some region, Some country"
        onPress={() => {}}
      />
    </YStack>
  )
}

export function LocationSuggestionRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Location Suggestion Row" demos={Demos} />
}
