import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {useAtom, type PrimitiveAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useMemo} from 'react'
import {Modal, ScrollView} from 'react-native'
import {type MarkedDates} from 'react-native-calendars/src/types'
import {Stack, Text, getTokens} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Calendar, {
  REACT_NATIVE_CALENDARS_DATE_FORMAT,
} from '../../../../Calendar'
import Screen from '../../../../Screen'
import ScreenTitle from '../../../../ScreenTitle'

interface Props {
  expirationDateAtom: PrimitiveAtom<JSDateString | undefined>
  offerExpirationModalVisibleAtom: PrimitiveAtom<boolean>
}

function OfferExpirationModal({
  expirationDateAtom,
  offerExpirationModalVisibleAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()

  const [expirationDate, setExpirationDate] = useAtom(expirationDateAtom)
  const [offerExpirationModalVisible, setOfferExpirationModalVisible] = useAtom(
    offerExpirationModalVisibleAtom
  )

  const markedDates: MarkedDates | undefined = useMemo(
    () =>
      expirationDate
        ? {
            [`${DateTime.fromISO(expirationDate).toFormat(
              REACT_NATIVE_CALENDARS_DATE_FORMAT
            )}`]: {selected: true, marked: true},
          }
        : undefined,
    [expirationDate]
  )

  return (
    <Modal
      animationType="fade"
      transparent
      visible={offerExpirationModalVisible}
    >
      <Screen customHorizontalPadding={getTokens().space[2].val}>
        <ScreenTitle
          text={t('offerForm.expiration.offerExpirationDate')}
          textColor="$greyAccent5"
          onBackButtonPress={() => {
            setOfferExpirationModalVisible(false)
          }}
          withBackButton
          withBottomBorder
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text col="$white" fos={16} ff="$body500">
            {t('offerForm.expiration.uponThisDate')}
          </Text>
          <Stack f={1} my="$6">
            <Calendar
              markedDates={markedDates}
              onDayPress={(date) => {
                setExpirationDate(JSDateString.parse(date.dateString))
                setOfferExpirationModalVisible(false)
              }}
            />
          </Stack>
        </ScrollView>
      </Screen>
    </Modal>
  )
}

export default OfferExpirationModal
