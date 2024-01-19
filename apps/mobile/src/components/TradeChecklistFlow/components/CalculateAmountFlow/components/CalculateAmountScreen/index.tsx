import Content from '../../../Content'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {Stack, XStack} from 'tamagui'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'
import {
  btcInputValueAtom,
  fiatInputValueAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
  syncDataWithChatStateActionAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import CurrentBtcPrice from '../CurrentBtcPrice'
import {useCallback, useEffect, useMemo} from 'react'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import BtcAmountInput from '../../components/BtcAmountInput'
import FiatAmountInput from '../../components/FiatAmountInput'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import Info from '../../../../../Info'
import calculatePercentageDifference from '../../../../../../utils/calculatePercentageDifference'
import {otherSideDataAtom} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {btcPriceForOfferWithStateAtom} from '../../../../atoms/btcPriceForOfferWithStateAtom'

type Props = TradeChecklistStackScreenProps<'CalculateAmount'>

function CalculateAmountScreen({
  route: {
    params: {amountData, navigateBackToChatOnSave},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const syncDataWithChatState = useSetAtom(syncDataWithChatStateActionAtom)
  const saveLocalCalculatedAmountDataStateToMainState = useSetAtom(
    saveLocalCalculatedAmountDataStateToMainStateActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)

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
      saveLocalCalculatedAmountDataStateToMainState()
      if (navigateBackToChatOnSave) {
        showLoadingOverlay(true)
        void submitTradeChecklistUpdates()().finally(() => {
          showLoadingOverlay(false)
        })
      }
      goBack()
    })
  }, [
    goBack,
    navigateBackToChatOnSave,
    saveLocalCalculatedAmountDataStateToMainState,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
  ])

  useEffect(() => {
    void syncDataWithChatState(amountData)
  }, [amountData, syncDataWithChatState])

  return (
    <>
      <HeaderProxy
        onClose={goBack}
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
            <CurrentBtcPrice />
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
            <BtcAmountInput
              btcValueAtom={btcInputValueAtom}
              fiatValueAtom={fiatInputValueAtom}
            />
            <FiatAmountInput
              showSubtitle
              btcValueAtom={btcInputValueAtom}
              fiatValueAtom={fiatInputValueAtom}
            />
          </Stack>
          <PremiumOrDiscount />
        </Stack>
      </Content>
      <FooterButtonProxy
        disabled={saveButtonDisabled}
        onPress={onFooterButtonPress}
        text={t('common.save')}
      />
    </>
  )
}

export default CalculateAmountScreen
