import {DateSuggestionCard, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <DateSuggestionCard
        weekday="Monday"
        dateLabel="6 Oct 2026"
        slotsCaption="time slots"
        slots="10:00, 14:30, 18:00"
        onPress={() => {}}
      />
      <DateSuggestionCard
        weekday="Tuesday"
        dateLabel="7 Oct 2026"
        slotsCaption="time slots"
        slots="09:00"
        onPress={() => {}}
      />
      <DateSuggestionCard
        weekday="Friday"
        dateLabel="3 Oct 2026"
        slotsCaption="Outdated"
        slots="12:00"
        outdated
        onPress={() => {}}
      />
    </YStack>
  )
}

export function DateSuggestionCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Date Suggestion Card" demos={Demos} />
}
