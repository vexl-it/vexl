import {
  Collapse,
  DateSlotsSummaryRow,
  FilterTag,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const slots = ['10:00', '10:30', '11:00', '11:30']

function ExpandableDemo(): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<readonly string[]>(['10:30'])

  return (
    <DateSlotsSummaryRow
      weekday="friday"
      label="Nov 6, 2026"
      action={{
        label: expanded ? 'Hide time slots' : 'Add time slots',
        onPress: () => {
          setExpanded((value) => !value)
        },
      }}
    >
      <Collapse expanded={expanded}>
        <XStack flexWrap="wrap" gap="$3" paddingTop="$7">
          {slots.map((slot) => (
            <FilterTag
              key={slot}
              label={slot}
              selected={selected.includes(slot)}
              backgroundColor="$backgroundTertiary"
              minWidth="$12.5"
              onPress={() => {
                setSelected((previous) =>
                  previous.includes(slot)
                    ? previous.filter((value) => value !== slot)
                    : [...previous, slot]
                )
              }}
            />
          ))}
        </XStack>
      </Collapse>
    </DateSlotsSummaryRow>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <DateSlotsSummaryRow
        weekday="Thursday"
        label="Nov 5, 2026"
        caption="time slots"
        value="10:00, 14:30, 18:00"
        onPress={() => {
          Alert.alert('Date pressed')
        }}
      />
      <DateSlotsSummaryRow
        weekday="Monday"
        label="Nov 2, 2026"
        caption="Outdated"
        value="09:00"
        outdated
      />
      <ExpandableDemo />
    </YStack>
  )
}

export function DateSlotsSummaryRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Date Slots Summary Row" demos={Demos} />
}
