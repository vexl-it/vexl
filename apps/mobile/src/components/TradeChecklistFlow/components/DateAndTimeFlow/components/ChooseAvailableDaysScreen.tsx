import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useEffect, useMemo} from 'react'
import {type MarkedDates} from 'react-native-calendars/src/types'
import {Stack} from 'tamagui'
import {
  type TradeChecklistStackParamsList,
  type TradeChecklistStackScreenProps,
} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import Calendar, {
  defaultMinDate,
  REACT_NATIVE_CALENDARS_DATE_FORMAT,
} from '../../../../Calendar'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../PageWithNavigationHeader'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../utils'
import Content from '../../Content'
import Header from '../../Header'
import {
  anyAvailableDateLowerThanTodayAtom,
  handleAvailableDaysChangeActionAtom,
  setAvailableDateTimesActionAtom,
  uniqueAvailableDatesAtom,
} from '../atoms'

type Props = TradeChecklistStackScreenProps<'ChooseAvailableDays'>

function ChooseAvailableDaysScreen({
  route: {
    params: {chosenDateTimes},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const setAvailableDateTimes = useSetAtom(setAvailableDateTimesActionAtom)
  const uniqueAvailableDates = useAtomValue(uniqueAvailableDatesAtom)
  const anyAvailableDateLowerThanToday = useAtomValue(
    anyAvailableDateLowerThanTodayAtom
  )
  const handleAvailableDaysChange = useSetAtom(
    handleAvailableDaysChangeActionAtom
  )

  const markedDates: MarkedDates = useMemo(
    () =>
      uniqueAvailableDates.reduce(
        (result: MarkedDates, date: UnixMilliseconds) => {
          return {
            ...result,
            [unixMillisecondsToLocaleDateTime(date).toFormat(
              REACT_NATIVE_CALENDARS_DATE_FORMAT
            )]: {selected: true, marked: true},
          }
        },
        {}
      ),
    [uniqueAvailableDates]
  )

  useEffect(() => {
    setAvailableDateTimes(chosenDateTimes ?? [])
  }, [chosenDateTimes, setAvailableDateTimes])

  return (
    <>
      <HeaderProxy title={t('tradeChecklist.dateAndTime.screenTitle')} />
      <Content scrollable>
        <Header
          title={t('tradeChecklist.dateAndTime.chooseAvailableDays')}
          subtitle={t('tradeChecklist.dateAndTime.addTimeOptionsLater')}
        />
        <Stack f={1} my="$6">
          <Calendar
            disableAllTouchEventsForDisabledDays={false}
            markedDates={markedDates}
            onDayPress={handleAvailableDaysChange}
            minDate={
              anyAvailableDateLowerThanToday
                ? DateTime.fromMillis(
                    Math.min(...uniqueAvailableDates)
                  ).toFormat(REACT_NATIVE_CALENDARS_DATE_FORMAT)
                : defaultMinDate
            }
          />
        </Stack>
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        disabled={
          uniqueAvailableDates.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD
        }
        text={t('common.continue')}
        onPress={() => {
          navigation.navigate('AddTimeOptions')
        }}
      />
    </>
  )
}

export default ChooseAvailableDaysScreen
