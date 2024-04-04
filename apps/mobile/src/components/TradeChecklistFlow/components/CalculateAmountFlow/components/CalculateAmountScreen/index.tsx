import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {useCallback, useEffect, useMemo} from 'react'
import {Stack, XStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {
  chatWithMessagesKeys,
  otherSideDataAtom,
} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import calculatePercentageDifference from '../../../../../../utils/calculatePercentageDifference'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import CurrentBtcPrice from '../../../../../CurrentBtcPrice'
import Info from '../../../../../Info'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import Content from '../../../Content'
import {
  btcInputValueAtom,
  btcPriceCurrencyAtom,
  btcPriceForOfferWithStateAtom,
  calculateBtcValueAfterBtcPriceRefreshActionAtom,
  fiatInputValueAtom,
  isOtherSideAmountDataNewerThanMineAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
  syncDataWithChatStateActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../../atoms'
import BtcAmountInput from '../../components/BtcAmountInput'
import FiatAmountInput from '../../components/FiatAmountInput'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'

type Props = TradeChecklistStackScreenProps<'CalculateAmount'>

function CalculateAmountScreen({
  navigation,
  route: {
    params: {amountData},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()

  const isOtherSideAmountDataNewerThanMine = useAtomValue(
    isOtherSideAmountDataNewerThanMineAtom
  )
  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const store = useStore()
  const shouldNavigateBackToChatOnSave =
    !useWasOpenFromAgreeOnTradeDetailsScreen()
  const syncDataWithChatState = useSetAtom(syncDataWithChatStateActionAtom)
  const saveLocalCalculatedAmountDataStateToMainState = useSetAtom(
    saveLocalCalculatedAmountDataStateToMainStateActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const calculateBtcValueAfterBtcPriceRefresh = useSetAtom(
    calculateBtcValueAfterBtcPriceRefreshActionAtom
  )

  const btcPricePercentageDifference = useMemo(() => {
    if (tradePriceType === 'custom' && amountData?.btcPrice)
      return calculatePercentageDifference(
        amountData.btcPrice,
        btcPriceForOfferWithState?.btcPrice
      )

    return 0
  }, [amountData?.btcPrice, btcPriceForOfferWithState, tradePriceType])

  const onFooterButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      void saveLocalCalculatedAmountDataStateToMainState()().then((success) => {
        if (success) {
          if (shouldNavigateBackToChatOnSave) {
            showLoadingOverlay(true)
            void submitTradeChecklistUpdates()().finally(() => {
              showLoadingOverlay(false)
            })
            navigation.navigate('ChatDetail', store.get(chatWithMessagesKeys))
          } else {
            navigation.navigate('AgreeOnTradeDetails')
          }
        }
      })
    })
  }, [
    saveLocalCalculatedAmountDataStateToMainState,
    shouldNavigateBackToChatOnSave,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
    navigation,
    store,
  ])

  useEffect(() => {
    void syncDataWithChatState(amountData)
  }, [amountData, syncDataWithChatState])

  return (
    <>
      <HeaderProxy
        onClose={navigation.goBack}
        title={t('tradeChecklist.calculateAmount.calculateAmount')}
      />
      <Content scrollable>
        <Stack space="$4">
          <XStack ai="center" jc="space-between">
            <SwitchTradePriceTypeButton
              onPress={() => {
                setTradePriceTypeDialogVisible(true)
              }}
            />
            <CurrentBtcPrice
              currencyAtom={btcPriceCurrencyAtom}
              customBtcPriceAtom={
                tradePriceType === 'your' ? tradeBtcPriceAtom : undefined
              }
              postRefreshActions={calculateBtcValueAfterBtcPriceRefresh}
            />
          </XStack>
          {tradePriceType === 'custom' && (
            <Info
              hideCloseButton
              variant="yellow"
              text={`${t(
                'tradeChecklist.calculateAmount.choseToCalculateWithCustomPrice',
                {
                  username: otherSideData.userName,
                  percentage: btcPricePercentageDifference,
                }
              )} ${
                btcPricePercentageDifference >= 0
                  ? t('vexlbot.higherThanLivePrice')
                  : t('vexlbot.lowerThanLivePrice')
              }`}
            />
          )}
          <Stack space="$2">
            <BtcAmountInput btcValueAtom={btcInputValueAtom} />
            <FiatAmountInput showSubtitle fiatValueAtom={fiatInputValueAtom} />
          </Stack>
          <PremiumOrDiscount />
        </Stack>
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        disabled={saveButtonDisabled}
        onPress={onFooterButtonPress}
        text={
          isOtherSideAmountDataNewerThanMine
            ? t('common.accept')
            : t('common.save')
        }
      />
    </>
  )
}

export default CalculateAmountScreen
