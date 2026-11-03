import {Record} from 'effect'
import React, {useMemo} from 'react'
import {
  Calendar as RNCalendar,
  type DateData,
  type CalendarProps as RNCalendarProps,
} from 'react-native-calendars'
import {type MarkingProps} from 'react-native-calendars/src/calendar/day/marking'
import {type CalendarHeaderProps} from 'react-native-calendars/src/calendar/header'
import {weekDayNames} from 'react-native-calendars/src/dateutils'
import {type DayState, type MarkedDates} from 'react-native-calendars/src/types'
import {getTokens, useTheme} from 'tamagui'

import {ChevronLeft} from '../icons/ChevronLeft'
import {ChevronRight} from '../icons/ChevronRight'
import {Stack, XStack, YStack} from '../primitives'
import {NavButton} from './NavButton'
import {Typography} from './Typography'

export type CalendarDateData = DateData
export type CalendarMarkedDates = MarkedDates

export interface CalendarPickerProps extends Omit<RNCalendarProps, 'firstDay'> {
  /** First day of the week, 0 = Sunday. */
  readonly firstDay: number
}

const calendarTheme = {
  calendarBackground: 'transparent',
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
}

function CalendarHeader({
  addMonth,
  firstDay,
  month,
  testID,
}: Pick<
  CalendarHeaderProps,
  'addMonth' | 'firstDay' | 'month' | 'testID'
>): React.JSX.Element {
  const dayNames: readonly string[] = weekDayNames(firstDay)

  return (
    <YStack marginBottom="$4" testID={testID}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$7"
      >
        <NavButton
          variant="transparent"
          icon={ChevronLeft}
          hitSlop={getTokens().space.$4.val}
          onPress={() => {
            addMonth?.(-1)
          }}
        />
        <Typography color="$foregroundPrimary" variant="descriptionBold">
          {month?.toString('MMMM yyyy')}
        </Typography>
        <NavButton
          variant="transparent"
          icon={ChevronRight}
          hitSlop={getTokens().space.$4.val}
          onPress={() => {
            addMonth?.(1)
          }}
        />
      </XStack>
      <XStack justifyContent="space-between">
        {dayNames.map((dayName) => (
          <Stack key={dayName} flex={1} alignItems="center">
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
  testID,
}: {
  readonly date?: DateData
  readonly marking?: MarkingProps
  readonly onPress?: (date?: DateData) => void
  readonly onLongPress?: (date?: DateData) => void
  readonly state?: DayState
  readonly testID?: string
}): React.JSX.Element {
  const theme = useTheme()
  const isSelected = marking?.selected === true || state === 'selected'
  const isDisabled = marking?.disabled === true || state === 'disabled'
  const isInactive = marking?.inactive === true || state === 'inactive'
  const isToday = marking?.today === true || state === 'today'
  const textColor = isSelected
    ? '$black100'
    : isDisabled || isInactive
      ? '$foregroundTertiary'
      : isToday
        ? '$accentYellowPrimary'
        : '$foregroundPrimary'

  return (
    <Stack
      role={isDisabled ? undefined : 'button'}
      disabled={marking?.disableTouchEvent === true}
      alignSelf="stretch"
      aspectRatio={1}
      padding="$0.5"
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
        alignItems="center"
        justifyContent="center"
        borderRadius={999}
        backgroundColor={
          isSelected
            ? (marking?.selectedColor ?? theme.accentYellowPrimary.get())
            : 'transparent'
        }
      >
        <Typography
          allowFontScaling={false}
          variant="description"
          color={textColor}
          textAlign="center"
        >
          {date?.day}
        </Typography>
      </Stack>
    </Stack>
  )
}

export function CalendarPicker({
  markedDates,
  ...rest
}: CalendarPickerProps): React.JSX.Element {
  const markedDatesWithoutDotsOnSelected = useMemo(
    () =>
      markedDates &&
      Record.map(markedDates, (marking) =>
        marking.selected
          ? {...marking, marked: false, dotColor: undefined}
          : marking
      ),
    [markedDates]
  )

  return (
    <RNCalendar
      enableSwipeMonths
      disableAllTouchEventsForDisabledDays
      customHeader={CalendarHeader}
      dayComponent={CalendarDay}
      theme={calendarTheme}
      markedDates={markedDatesWithoutDotsOnSelected}
      {...rest}
    />
  )
}
