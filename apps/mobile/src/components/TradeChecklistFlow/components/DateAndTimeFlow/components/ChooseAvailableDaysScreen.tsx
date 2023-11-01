import {Calendar, type DateData} from 'react-native-calendars'
import {type MarkedDates, type Theme} from 'react-native-calendars/src/types'
import ScreenWrapper from '../../ScreenWrapper'
import ScreenHeader from '../../ScreenHeader'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {StyleSheet} from 'react-native'
import {DateTime} from 'luxon'
import {Stack} from 'tamagui'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {useAtom, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import addToSortedArray from '../../../../../utils/addToSortedArray'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {
  availableDateTimesAtom,
  syncAvailableDateTimesWithMainStateActionAtom,
} from '../atoms'
import {type AvailableDateTimeOption} from '../../../domain'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../utils'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'

export const reactNativeCalendarsDateFormat = 'yyyy-MM-dd'

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

const today = DateTime.now().toFormat(reactNativeCalendarsDateFormat)

function ChooseAvailableDaysScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const [availableDateTimes, setAvailableDateTimes] = useAtom(
    availableDateTimesAtom
  )
  const syncAvailableDateTimesWithMainState = useSetAtom(
    syncAvailableDateTimesWithMainStateActionAtom
  )

  function handleAvailableDaysChange(day: DateData): void {
    const millis = UnixMilliseconds.parse(
      DateTime.fromMillis(day.timestamp).startOf('day').toMillis()
    )

    if (availableDateTimes.some((dateTime) => dateTime.date === millis)) {
      setAvailableDateTimes(
        availableDateTimes.filter(
          (availableDateTime) => availableDateTime.date !== millis
        )
      )
    } else {
      setAvailableDateTimes(
        addToSortedArray(
          availableDateTimes,
          (t1, t2) => t1.date - t2.date
        )({from: millis, to: millis, date: millis})
      )
    }
  }

  const markedDates: MarkedDates = useMemo(
    () =>
      availableDateTimes.reduce(
        (result: MarkedDates, dateTime: AvailableDateTimeOption) => {
          return {
            ...result,
            [DateTime.fromMillis(dateTime.date).toFormat(
              reactNativeCalendarsDateFormat
            )]: {selected: true},
          }
        },
        {}
      ),
    [availableDateTimes]
  )

  useEffect(() => {
    syncAvailableDateTimesWithMainState()
  }, [syncAvailableDateTimesWithMainState])

  return (
    <ScreenWrapper
      scrollable
      navigationRowShown
      onBackButtonPress={goBack}
      onCloseButtonPress={goBack}
      screenTitle={t('tradeChecklist.dateAndTime.screenTitle')}
      onButtonPress={() => {
        navigation.navigate('AddTimeOptions')
      }}
      buttonTitle={t('common.continue')}
      buttonDisabled={
        availableDateTimes.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD
      }
    >
      <ScreenHeader
        title={t('tradeChecklist.dateAndTime.chooseAvailableDays')}
        subtitle={t('tradeChecklist.dateAndTime.addTimeOptionsLater')}
      />
      <Stack f={1} my={'$6'}>
        <Calendar
          headerStyle={styles.header}
          disableAllTouchEventsForDisabledDays
          minDate={today}
          theme={calendarTheme}
          markedDates={markedDates}
          onDayPress={handleAvailableDaysChange}
        />
      </Stack>
    </ScreenWrapper>
  )
}

export default ChooseAvailableDaysScreen
