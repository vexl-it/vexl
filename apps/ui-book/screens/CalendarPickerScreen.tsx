import {
  CalendarPicker,
  useTheme,
  type CalendarDateData,
  type CalendarMarkedDates,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const theme = useTheme()
  const [selected, setSelected] = useState<readonly string[]>([])
  const markedDates: CalendarMarkedDates = {
    '2026-11-02': {
      selected: true,
      selectedColor: theme.backgroundHighlight.get(),
    },
    ...Object.fromEntries(selected.map((date) => [date, {selected: true}])),
  }

  return (
    <CalendarPicker
      firstDay={1}
      current="2026-11-03"
      minDate="2026-11-03"
      markedDates={markedDates}
      onDayPress={(day: CalendarDateData) => {
        setSelected((previous) =>
          previous.includes(day.dateString)
            ? previous.filter((date) => date !== day.dateString)
            : [...previous, day.dateString]
        )
      }}
    />
  )
}

export function CalendarPickerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Calendar Picker" demos={Demos} />
}
