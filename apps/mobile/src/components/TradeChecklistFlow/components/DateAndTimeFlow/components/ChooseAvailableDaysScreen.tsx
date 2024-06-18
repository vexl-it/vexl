import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {useAtom, useSetAtom} from 'jotai'
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
  availableDateTimesAtom,
  handleAvailableDaysChangeActionAtom,
} from '../atoms'

type Props = TradeChecklistStackScreenProps<'ChooseAvailableDays'>

function ChooseAvailableDaysScreen({
  route: {
    params: {chosenDays},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
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
            [unixMillisecondsToLocaleDateTime(dateTime.date).toFormat(
              REACT_NATIVE_CALENDARS_DATE_FORMAT
            )]: {selected: true, marked: true},
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
      <HeaderProxy title={t('tradeChecklist.dateAndTime.screenTitle')} />
      <Content scrollable>
        <Header
          title={t('tradeChecklist.dateAndTime.chooseAvailableDays')}
          subtitle={t('tradeChecklist.dateAndTime.addTimeOptionsLater')}
        />
        <Stack f={1} my="$6">
          <Calendar
            markedDates={markedDates}
            onDayPress={handleAvailableDaysChange}
          />
        </Stack>
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
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
