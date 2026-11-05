import {CalendarPicker, type CalendarPickerProps} from '@vexl-next/ui'
import {useCalendars} from 'expo-localization'
import {DateTime} from 'luxon'
import React from 'react'

export const REACT_NATIVE_CALENDARS_DATE_FORMAT = 'yyyy-MM-dd'

function Calendar(
  props: Omit<CalendarPickerProps, 'firstDay'>
): React.ReactElement {
  const calendars = useCalendars()
  // expo-localization counts weekdays 1 (Sunday) to 7, react-native-calendars 0 to 6.
  const firstDay = ((calendars[0]?.firstWeekday ?? 1) + 6) % 7

  return (
    <CalendarPicker
      firstDay={firstDay}
      minDate={DateTime.now().toFormat(REACT_NATIVE_CALENDARS_DATE_FORMAT)}
      {...props}
    />
  )
}

export default Calendar
