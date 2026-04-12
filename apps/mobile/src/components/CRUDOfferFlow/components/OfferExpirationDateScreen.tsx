import {useNavigation} from '@react-navigation/native'
import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {Button, NavigationBar, Screen, Typography} from '@vexl-next/ui'
import {ChevronLeft} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {Schema} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useMemo, useState} from 'react'
import {type MarkedDates} from 'react-native-calendars/src/types'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Calendar, {REACT_NATIVE_CALENDARS_DATE_FORMAT} from '../../Calendar'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

function OfferExpirationDateScreen(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {expirationDateAtom} = useMolecule(offerFormMolecule)
  const expirationDate = useAtomValue(expirationDateAtom)
  const setExpirationDate = useSetAtom(expirationDateAtom)

  const [pendingDate, setPendingDate] = useState<JSDateString | undefined>(
    expirationDate
  )

  const markedDates: MarkedDates | undefined = useMemo(
    () =>
      pendingDate
        ? {
            [`${DateTime.fromISO(pendingDate).toFormat(
              REACT_NATIVE_CALENDARS_DATE_FORMAT
            )}`]: {selected: true, marked: true},
          }
        : undefined,
    [pendingDate]
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('offerForm.expiration.selectDateTitle')}
          leftAction={{
            icon: ChevronLeft,
            onPress: () => {
              navigation.goBack()
            },
          }}
        />
      }
      footer={
        <Button
          variant="primary"
          size="large"
          disabled={!pendingDate}
          onPress={() => {
            if (pendingDate) setExpirationDate(pendingDate)
            navigation.goBack()
          }}
        >
          {t('offerForm.expiration.confirm')}
        </Button>
      }
    >
      <Typography variant="description" color="$foregroundSecondary">
        {t('offerForm.expiration.afterThisDate')}
      </Typography>
      <Stack flex={1} marginTop="$7">
        <Calendar
          markedDates={markedDates}
          onDayPress={(date) => {
            setPendingDate(Schema.decodeSync(JSDateString)(date.dateString))
          }}
        />
      </Stack>
    </Screen>
  )
}

export default OfferExpirationDateScreen
