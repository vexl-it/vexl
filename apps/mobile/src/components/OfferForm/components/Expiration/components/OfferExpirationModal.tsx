import {Modal, ScrollView} from 'react-native'
import {type PrimitiveAtom, useAtom} from 'jotai'
import {Stack, Text} from 'tamagui'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import ScreenTitle from '../../../../ScreenTitle'
import IconButton from '../../../../IconButton'
import closeSvg from '../../../../images/closeSvg'
import React, {useMemo} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Calendar, {
  REACT_NATIVE_CALENDARS_DATE_FORMAT,
} from '../../../../Calendar'
import {type MarkedDates} from 'react-native-calendars/src/types'
import {DateTime} from 'luxon'
import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'

interface Props {
  expirationDateAtom: PrimitiveAtom<JSDateString | undefined>
  offerExpirationModalVisibleAtom: PrimitiveAtom<boolean>
}

function OfferExpirationModal({
  expirationDateAtom,
  offerExpirationModalVisibleAtom,
}: Props): JSX.Element {
  const {bottom, top} = useSafeAreaInsets()
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
            )}`]: {selected: true},
          }
        : undefined,
    [expirationDate]
  )

  return (
    <Modal
      animationType={'fade'}
      transparent
      visible={offerExpirationModalVisible}
    >
      <Stack f={1} bc={'$grey'} px={'$4'} pb={bottom} pt={top}>
        <ScreenTitle
          text={t('offerForm.expiration.offerExpirationDate')}
          textColor={'$greyAccent5'}
        >
          <IconButton
            variant={'dark'}
            icon={closeSvg}
            onPress={() => {
              setOfferExpirationModalVisible(false)
            }}
          />
        </ScreenTitle>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text col={'$white'} fos={16} ff={'$body500'}>
            {t('offerForm.expiration.uponThisDate')}
          </Text>
          <Stack f={1} my={'$6'}>
            <Calendar
              markedDates={markedDates}
              onDayPress={(date) => {
                setExpirationDate(JSDateString.parse(date.dateString))
                setOfferExpirationModalVisible(false)
              }}
            />
          </Stack>
        </ScrollView>
      </Stack>
    </Modal>
  )
}

export default OfferExpirationModal
