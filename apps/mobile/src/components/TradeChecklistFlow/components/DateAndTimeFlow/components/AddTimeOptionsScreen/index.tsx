import ScreenWrapper from '../../../ScreenWrapper'
import ScreenHeader from '../../../ScreenHeader'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {useAtomValue, useSetAtom} from 'jotai'
import {
  availableDateTimesAtom,
  saveLocalDateTimeStateToMainStateActionAtom,
} from '../../atoms'
import TimeOptionCell from './components/TimeOptionCell'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {TouchableOpacity} from 'react-native'
import Image from '../../../../../Image'
import plusSvg from '../../../../../MyOffersScreen/images/plusSvg'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import React from 'react'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../../utils'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../../navigationTypes'

const BOTTOM_MARGIN_FOR_OPENED_PICKER = 120

function AddTimeOptionsScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const saveLocalDateTimeStateToMainState = useSetAtom(
    saveLocalDateTimeStateToMainStateActionAtom
  )
  const availableDateTimes = useAtomValue(availableDateTimesAtom)

  return (
    <ScreenWrapper
      scrollable
      navigationRowShown
      screenTitle={t('tradeChecklist.dateAndTime.screenTitle')}
      onButtonPress={() => {
        saveLocalDateTimeStateToMainState()
        navigation.navigate('AgreeOnTradeDetails')
      }}
      onBackButtonPress={goBack}
      onCloseButtonPress={() => {
        navigation.navigate('AgreeOnTradeDetails')
      }}
      buttonTitle={t('common.save')}
      buttonDisabled={
        availableDateTimes.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD
      }
    >
      <Stack f={1}>
        <ScreenHeader
          title={t('tradeChecklist.dateAndTime.addYourTimeOptions')}
        />
        <Stack f={1} mt={'$4'}>
          {availableDateTimes.map((value) => (
            <TimeOptionCell key={value.date} availableDateTime={value} />
          ))}
          <Stack zi={-1} mb={BOTTOM_MARGIN_FOR_OPENED_PICKER}>
            <TouchableOpacity onPress={goBack}>
              <XStack ai={'center'} jc={'space-between'} py={'$6'}>
                <Text fos={16} ff={'$body500'} col={'$greyOnBlack'}>
                  {t('common.addMore')}
                </Text>
                <Image
                  width={24}
                  height={24}
                  source={plusSvg}
                  stroke={getTokens().color.greyOnBlack.val}
                />
              </XStack>
            </TouchableOpacity>
          </Stack>
        </Stack>
      </Stack>
    </ScreenWrapper>
  )
}

export default AddTimeOptionsScreen
