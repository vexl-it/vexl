import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Stack, Typography, useTheme} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useEffect, useMemo} from 'react'
import {type MarkedDates} from 'react-native-calendars/src/types'
import {
  type TradeChecklistStackParamsList,
  type TradeChecklistStackScreenProps,
} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import Calendar, {
  REACT_NATIVE_CALENDARS_DATE_FORMAT,
} from '../../../../Calendar'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../utils'
import {TradeChecklistItemPageLayout} from '../../TradeChecklistItemPageLayout'
import {
  handleAvailableDaysChangeActionAtom,
  setAvailableDateTimesActionAtom,
  uniqueAvailableDatesAtom,
} from '../atoms'

type Props = TradeChecklistStackScreenProps<'ChooseAvailableDays'>

function ChooseAvailableDaysScreen({
  route: {
    params: {chosenDateTimes},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const setAvailableDateTimes = useSetAtom(setAvailableDateTimesActionAtom)
  const uniqueAvailableDates = useAtomValue(uniqueAvailableDatesAtom)
  const handleAvailableDaysChange = useSetAtom(
    handleAvailableDaysChangeActionAtom
  )

  const markedDates: MarkedDates = useMemo(
    () =>
      pipe(
        uniqueAvailableDates,
        Array.reduce({}, (result: MarkedDates, date: UnixMilliseconds) => {
          return {
            ...result,
            [unixMillisecondsToLocaleDateTime(date).toFormat(
              REACT_NATIVE_CALENDARS_DATE_FORMAT
            )]: {
              selected: true,
              marked: true,
              selectedColor:
                unixMillisecondsToLocaleDateTime(date)
                  .startOf('day')
                  .toMillis() < DateTime.now().startOf('day').toMillis()
                  ? theme.backgroundHighlight.get()
                  : theme.accentYellowPrimary.get(),
            },
          }
        })
      ),
    [theme, uniqueAvailableDates]
  )

  useEffect(() => {
    setAvailableDateTimes(chosenDateTimes ?? [])
  }, [chosenDateTimes, setAvailableDateTimes])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.dateAndTime.screenTitle'),
      }}
      bottomButton={{
        disabled:
          uniqueAvailableDates.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD,
        text: t('common.continue'),
        onPress: () => {
          navigation.navigate('AddTimeOptions')
        },
      }}
    >
      <Stack f={1} mt="$5" mb="$7">
        <Typography color="$foregroundSecondary" variant="description">
          {t('tradeChecklist.dateAndTime.selectDates.description')}
        </Typography>
        <Stack mt="$7">
          <Calendar
            markedDates={markedDates}
            onDayPress={handleAvailableDaysChange}
          />
        </Stack>
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default ChooseAvailableDaysScreen
