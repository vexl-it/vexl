import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {
  type TradeChecklistStackParamsList,
  type TradeChecklistStackScreenProps,
} from '../../../../../../navigationTypes'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {useGoBackXTimes} from '../../../../../../utils/navigation'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import Image from '../../../../../Image'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import plusSvg from '../../../../../MyOffersScreen/images/plusSvg'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import {
  addDateAndTimeSuggestionsActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../../utils'
import Content from '../../../Content'
import Header from '../../../Header'
import {availableDateTimesAtom} from '../../atoms'
import TimeOptionCell from './components/TimeOptionCell'

const BOTTOM_MARGIN_FOR_OPENED_PICKER = 120

type Props = TradeChecklistStackScreenProps<'AddTimeOptions'>

function AddTimeOptionsScreen({
  route: {
    params: {navigateBackToChatOnSave},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const goBackXTimes = useGoBackXTimes()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const addDateAndTimeSuggestions = useSetAtom(
    addDateAndTimeSuggestionsActionAtom
  )
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const availableDateTimes = useAtomValue(availableDateTimesAtom)

  const onFooterButtonPress = useCallback(() => {
    addDateAndTimeSuggestions(availableDateTimes)
    if (navigateBackToChatOnSave) {
      showLoadingOverlay(true)
      void submitTradeChecklistUpdates()().finally(() => {
        showLoadingOverlay(false)
      })
    }
    if (navigateBackToChatOnSave) {
      goBackXTimes(2)
    } else {
      navigation.navigate('AgreeOnTradeDetails')
    }
  }, [
    addDateAndTimeSuggestions,
    availableDateTimes,
    goBackXTimes,
    navigateBackToChatOnSave,
    navigation,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
  ])

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.dateAndTime.screenTitle')}
        onClose={() => {
          navigation.navigate('AgreeOnTradeDetails')
        }}
      />
      <Content scrollable>
        <Header title={t('tradeChecklist.dateAndTime.addYourTimeOptions')} />
        <Stack f={1} mt="$4">
          {availableDateTimes.map((value) => (
            <TimeOptionCell key={value.date} availableDateTime={value} />
          ))}
          <Stack zi={-1} mb={BOTTOM_MARGIN_FOR_OPENED_PICKER}>
            <TouchableOpacity onPress={goBack}>
              <XStack ai="center" jc="space-between" py="$6">
                <Text fos={16} ff="$body500" col="$greyOnBlack">
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
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        text={t('common.save')}
        disabled={availableDateTimes.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD}
        onPress={onFooterButtonPress}
      />
    </>
  )
}

export default AddTimeOptionsScreen
