import {TimeSuggestionCard, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const times = ['10:00', '14:30', '18:00']

function Demos(): React.JSX.Element {
  const [selected, setSelected] = useState('14:30')

  return (
    <YStack gap="$4">
      <TimeSuggestionCard label="08:00" outdated onPress={() => {}} />
      {times.map((time) => (
        <TimeSuggestionCard
          key={time}
          label={time}
          selected={selected === time}
          onPress={() => {
            setSelected(time)
          }}
        />
      ))}
    </YStack>
  )
}

export function TimeSuggestionCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Time Suggestion Card" demos={Demos} />
}
