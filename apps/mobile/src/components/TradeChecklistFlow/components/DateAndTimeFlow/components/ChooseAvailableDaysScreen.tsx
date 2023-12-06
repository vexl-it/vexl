import {type MarkedDates} from 'react-native-calendars/src/types'
import Header from '../../Header'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {DateTime} from 'luxon'
import {Stack} from 'tamagui'
import {
  type TradeChecklistStackParamsList,
  type TradeChecklistStackScreenProps,
} from '../../../../../navigationTypes'
import {useAtom, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import {
  availableDateTimesAtom,
  handleAvailableDaysChangeActionAtom,
} from '../atoms'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../utils'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'
import Calendar, {
  REACT_NATIVE_CALENDARS_DATE_FORMAT,
} from '../../../../Calendar'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../PageWithNavigationHeader'
import Content from '../../Content'

import {type AvailableDateTimeOption} from '@vexl-next/domain/dist/general/tradeChecklist'

type Props = TradeChecklistStackScreenProps<'ChooseAvailableDays'>

function ChooseAvailableDaysScreen({
  route: {
    params: {chosenDays},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const [availableDateTimes, setAvailableDateTimes] = useAtom(
    availableDateTimesAtom
  )
  const handleAvailableDaysChange = useSetAtom(
    handleAvailableDaysChangeActionAtom
  )

  const markedDates: MarkedDates = useMemo(
    () =>
      availableDateTimes.reduce(
        (result: MarkedDates, dateTime: AvailableDateTimeOption) => {
          return {
            ...result,
            [DateTime.fromMillis(dateTime.date)
              .setLocale(getCurrentLocale())
              .toFormat(REACT_NATIVE_CALENDARS_DATE_FORMAT)]: {selected: true},
          }
        },
        {}
      ),
    [availableDateTimes]
  )

  useEffect(() => {
    setAvailableDateTimes(chosenDays ?? [])
  }, [chosenDays, setAvailableDateTimes])

  return (
    <>
      <HeaderProxy
        onClose={goBack}
        title={t('tradeChecklist.dateAndTime.screenTitle')}
      />
      <Content scrollable>
        <Header
          title={t('tradeChecklist.dateAndTime.chooseAvailableDays')}
          subtitle={t('tradeChecklist.dateAndTime.addTimeOptionsLater')}
        />
        <Stack f={1} my={'$6'}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleAvailableDaysChange}
          />
        </Stack>
      </Content>
      <FooterButtonProxy
        disabled={availableDateTimes.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD}
        text={t('common.continue')}
        onPress={() => {
          navigation.navigate('AddTimeOptions')
        }}
      />
    </>
  )
}

export default ChooseAvailableDaysScreen
