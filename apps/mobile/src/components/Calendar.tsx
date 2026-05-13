import {ChevronLeft, ChevronRight, Typography} from '@vexl-next/ui'
import {useCalendars} from 'expo-localization'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {Pressable, Text} from 'react-native'
import {
  Calendar as RNCalendar,
  type CalendarProps,
} from 'react-native-calendars'
import {type MarkingProps} from 'react-native-calendars/src/calendar/day/marking'
import {type CalendarHeaderProps} from 'react-native-calendars/src/calendar/header'
import {weekDayNames} from 'react-native-calendars/src/dateutils'
import {
  type DateData,
  type DayState,
  type MarkedDates,
  type Theme,
} from 'react-native-calendars/src/types'
import {Stack, useTheme, XStack, YStack} from 'tamagui'

export const REACT_NATIVE_CALENDARS_DATE_FORMAT = 'yyyy-MM-dd'

export const defaultMinDate = DateTime.now().toFormat(
  REACT_NATIVE_CALENDARS_DATE_FORMAT
)

function CalendarHeader({
  addMonth,
  firstDay,
  month,
  testID,
  theme,
}: Pick<CalendarHeaderProps, 'addMonth' | 'firstDay' | 'month' | 'testID'> & {
  theme: ReturnType<typeof useTheme>
}): React.ReactElement {
  const dayNames = weekDayNames(firstDay)

  return (
    <YStack mb="$4" testID={testID}>
      <XStack ai="center" jc="space-between" mb="$7">
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            addMonth?.(-1)
          }}
        >
          <ChevronLeft color={theme.foregroundPrimary.get()} size={24} />
        </Pressable>
        <Typography color="$foregroundPrimary" variant="descriptionBold">
          {month?.toString('MMMM yyyy')}
        </Typography>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            addMonth?.(1)
          }}
        >
          <ChevronRight color={theme.foregroundPrimary.get()} size={24} />
        </Pressable>
      </XStack>
      <XStack jc="space-between">
        {dayNames.map((dayName: string) => (
          <Stack key={dayName} flex={1} ai="center" jc="center">
            <Typography color="$foregroundSecondary" variant="micro">
              {dayName}
            </Typography>
          </Stack>
        ))}
      </XStack>
    </YStack>
  )
}

function CalendarDay({
  date,
  marking,
  onPress,
  onLongPress,
  state,
  theme,
  testID,
}: {
  date?: DateData
  marking?: MarkingProps
  onPress?: (date?: DateData) => void
  onLongPress?: (date?: DateData) => void
  state?: DayState
  theme: ReturnType<typeof useTheme>
  testID?: string
}): React.ReactElement {
  const isSelected = marking?.selected === true || state === 'selected'
  const isDisabled = marking?.disabled === true || state === 'disabled'
  const isInactive = marking?.inactive === true || state === 'inactive'
  const isToday = marking?.today === true || state === 'today'
  const textColor = isSelected
    ? theme.black100.get()
    : isDisabled || isInactive
      ? theme.foregroundTertiary.get()
      : isToday
        ? theme.accentYellowPrimary.get()
        : theme.foregroundPrimary.get()

  return (
    <Pressable
      accessibilityRole={isDisabled ? undefined : 'button'}
      disabled={marking?.disableTouchEvent === true}
      style={{
        alignSelf: 'stretch',
        aspectRatio: 1,
        padding: 1,
      }}
      testID={testID}
      onLongPress={() => {
        onLongPress?.(date)
      }}
      onPress={() => {
        onPress?.(date)
      }}
    >
      <Stack
        flex={1}
        ai="center"
        jc="center"
        br={999}
        backgroundColor={
          isSelected
            ? (marking?.selectedColor ?? theme.accentYellowPrimary.get())
            : theme.gradientHelper.get()
        }
      >
        <Text
          allowFontScaling={false}
          style={{
            color: textColor,
            fontSize: 14,
            lineHeight: 16,
            fontWeight: '500',
            includeFontPadding: false,
            textAlign: 'center',
            textAlignVertical: 'center',
          }}
        >
          {date?.day}
        </Text>
      </Stack>
    </Pressable>
  )
}

function Calendar(props: CalendarProps): React.ReactElement {
  const theme = useTheme()
  const calendars = useCalendars()
  const {markedDates, ...restProps} = props
  const firstDay = ((calendars[0]?.firstWeekday ?? 1) + 6) % 7

  const calendarTheme: Theme = useMemo(
    () => ({
      calendarBackground: theme.gradientHelper.get(),
      dayTextColor: theme.foregroundPrimary.get(),
      arrowColor: theme.foregroundPrimary.get(),
      monthTextColor: theme.foregroundPrimary.get(),
      selectedDayTextColor: theme.black100.get(),
      textDayFontWeight: '500',
      textMonthFontWeight: '600',
      todayTextColor: theme.accentYellowPrimary.get(),
      agendaDayTextColor: theme.foregroundPrimary.get(),
      textSectionTitleColor: theme.foregroundSecondary.get(),
      textDayHeaderFontSize: 14,
      textDayFontSize: 14,
      selectedDayBackgroundColor: theme.accentYellowPrimary.get(),
      textDisabledColor: theme.foregroundTertiary.get(),
      selectedDotColor: theme.black100.get(),
      'stylesheet.calendar.main': {
        dayContainer: {
          flex: 1,
          alignItems: 'stretch',
        },
        week: {
          marginVertical: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
      },
    }),
    [theme]
  )

  const normalizedMarkedDates = useMemo<MarkedDates | undefined>(() => {
    if (!markedDates) return undefined

    return Object.fromEntries(
      Object.entries(markedDates).map(([date, config]) => [
        date,
        config?.selected
          ? {...config, marked: false, dotColor: undefined}
          : config,
      ])
    )
  }, [markedDates])

  return (
    <RNCalendar
      enableSwipeMonths
      disableAllTouchEventsForDisabledDays
      customHeader={(headerProps: CalendarHeaderProps) => (
        <CalendarHeader {...headerProps} theme={theme} />
      )}
      firstDay={firstDay}
      minDate={defaultMinDate}
      dayComponent={(dayProps) => <CalendarDay {...dayProps} theme={theme} />}
      theme={calendarTheme}
      markedDates={normalizedMarkedDates}
      {...restProps}
    />
  )
}

export default Calendar
