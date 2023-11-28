import {type MarkedDates} from 'react-native-calendars/src/types'
import Header from '../../Header'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {DateTime} from 'luxon'
import {Stack} from 'tamagui'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import {
  availableDateTimesAtom,
  handleAvailableDaysChangeActionAtom,
  syncAvailableDateTimesWithMainStateActionAtom,
} from '../atoms'
import {type AvailableDateTimeOption} from '../../../domain'
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

function ChooseAvailableDaysScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const availableDateTimes = useAtomValue(availableDateTimesAtom)
  const syncAvailableDateTimesWithMainState = useSetAtom(
    syncAvailableDateTimesWithMainStateActionAtom
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
            [DateTime.fromMillis(dateTime.date).toFormat(
              REACT_NATIVE_CALENDARS_DATE_FORMAT
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
