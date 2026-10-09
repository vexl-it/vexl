import {
  Button,
  DateTimeSlotsCard,
  TimeSlotChip,
  TimeSlotGroup,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const dates = [
  {weekday: 'monday', dateLabel: 'Oct 6, 2026', slots: ['10:00', '14:30']},
  {weekday: 'tuesday', dateLabel: 'Oct 7, 2026', slots: []},
]
const allSlots = ['09:00', '10:00', '11:00', '14:30', '16:00']

function Demos(): React.JSX.Element {
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  return (
    <YStack gap="$3">
      {dates.map(({weekday, dateLabel, slots}) => (
        <DateTimeSlotsCard
          key={dateLabel}
          weekday={weekday}
          dateLabel={dateLabel}
          expanded={expandedDate === dateLabel}
          onExpand={() => {
            setExpandedDate(dateLabel)
          }}
          onCollapse={() => {
            setExpandedDate(null)
          }}
          selectedSlots={slots.length > 0 ? slots.join(', ') : undefined}
          selectedSlotsCaption="time slots"
          expandLabel="Add time slots"
          collapseLabel="Hide time slots"
        >
          <TimeSlotGroup title="Morning">
            {allSlots.map((slot) => (
              <TimeSlotChip
                key={slot}
                label={slot}
                selected={slots.includes(slot)}
                onPress={() => {}}
              />
            ))}
          </TimeSlotGroup>
          <Button
            size="medium"
            variant="primary"
            onPress={() => {
              setExpandedDate(null)
            }}
          >
            Save
          </Button>
        </DateTimeSlotsCard>
      ))}
    </YStack>
  )
}

export function DateTimeSlotsCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Date Time Slots Card" demos={Demos} />
}
