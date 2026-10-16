import {TimeSlotChip, TimeSlotGroup, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const morning = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30']
const afternoon = ['12:00', '12:30', '13:00']

function useSelectedSlots(): {
  readonly isSelected: (slot: string) => boolean
  readonly toggle: (slot: string) => void
} {
  const [selected, setSelected] = useState<readonly string[]>(['09:00'])

  return {
    isSelected: (slot) => selected.includes(slot),
    toggle: (slot) => {
      setSelected((previous) =>
        previous.includes(slot)
          ? previous.filter((s) => s !== slot)
          : [...previous, slot]
      )
    },
  }
}

function Demos(): React.JSX.Element {
  const {isSelected, toggle} = useSelectedSlots()

  return (
    <YStack>
      <TimeSlotGroup title="Morning">
        {morning.map((slot) => (
          <TimeSlotChip
            key={slot}
            label={slot}
            selected={isSelected(slot)}
            onPress={() => {
              toggle(slot)
            }}
          />
        ))}
      </TimeSlotGroup>
      <TimeSlotGroup title="Afternoon">
        {afternoon.map((slot) => (
          <TimeSlotChip
            key={slot}
            label={slot}
            selected={isSelected(slot)}
            onPress={() => {
              toggle(slot)
            }}
          />
        ))}
      </TimeSlotGroup>
    </YStack>
  )
}

export function TimeSlotChipScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Time Slot Chip & Group" demos={Demos} />
}
