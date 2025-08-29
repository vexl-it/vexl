import {DateTime} from 'luxon'
import React from 'react'
import {StyleSheet} from 'react-native'
import {
  Calendar as RNCalendar,
  type CalendarProps,
} from 'react-native-calendars'
import {type Theme} from 'react-native-calendars/src/types'
import {getTokens} from 'tamagui'

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
})

const calendarTheme: Theme = {
  calendarBackground: 'transparent',
  dayTextColor: getTokens().color.white.val,
  arrowColor: getTokens().color.white.val,
  monthTextColor: getTokens().color.white.val,
  selectedDayTextColor: getTokens().color.black.val,
  textDayFontWeight: '500',
  textMonthFontWeight: '500',
  todayTextColor: getTokens().color.main.val,
  agendaDayTextColor: getTokens().color.white.val,
  textSectionTitleColor: getTokens().color.white.val,
  textDayHeaderFontSize: 14,
  textDayFontSize: 14,
  selectedDayBackgroundColor: getTokens().color.main.val,
  textDisabledColor: getTokens().color.greyAccent2.val,
  selectedDotColor: '#000000',
}

export const REACT_NATIVE_CALENDARS_DATE_FORMAT = 'yyyy-MM-dd'

export const defaultMinDate = DateTime.now().toFormat(
  REACT_NATIVE_CALENDARS_DATE_FORMAT
)

function Calendar(props: CalendarProps): React.ReactElement {
  return (
    <RNCalendar
      enableSwipeMonths
      disableAllTouchEventsForDisabledDays
      headerStyle={styles.header}
      minDate={defaultMinDate}
      theme={calendarTheme}
      {...props}
    />
  )
}

export default Calendar
