import {DateTime} from 'luxon'
import {StyleSheet} from 'react-native'
import {
  Calendar as RNCalendar,
  type CalendarProps,
} from 'react-native-calendars'
import {type Theme} from 'react-native-calendars/src/types'

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
})

const calendarTheme: Theme = {
  calendarBackground: 'transparent',
  dayTextColor: '#FFFFFF',
  arrowColor: '#FFFFFF',
  monthTextColor: '#FFFFFF',
  selectedDayTextColor: '#FCCD6C',
  textDayFontWeight: '500',
  textMonthFontWeight: '500',
  todayTextColor: '#FFFFFF',
  agendaDayTextColor: '#FFFFFF',
  textSectionTitleColor: '#FFFFFF',
  textDayHeaderFontSize: 14,
  textDayFontSize: 14,
  selectedDotColor: 'transparent',
  selectedDayBackgroundColor: 'transparent',
  textDisabledColor: '#A0A0AB',
}

export const REACT_NATIVE_CALENDARS_DATE_FORMAT = 'yyyy-MM-dd'

const defaultMinDate = DateTime.now().toFormat(
  REACT_NATIVE_CALENDARS_DATE_FORMAT
)

function Calendar(props: CalendarProps): JSX.Element {
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
