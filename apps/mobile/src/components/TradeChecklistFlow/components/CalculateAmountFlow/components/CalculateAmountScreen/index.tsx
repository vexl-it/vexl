import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useMemo} from 'react'
import {Stack, XStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {otherSideDataAtom} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import calculatePercentageDifference from '../../../../../../utils/calculatePercentageDifference'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import Info from '../../../../../Info'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import {btcPriceForOfferWithStateAtom} from '../../../../atoms/btcPriceForOfferWithStateAtom'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import Content from '../../../Content'
import {
  btcInputValueAtom,
  fiatInputValueAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
  syncDataWithChatStateActionAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../../atoms'
import BtcAmountInput from '../../components/BtcAmountInput'
import FiatAmountInput from '../../components/FiatAmountInput'
import CurrentBtcPrice from '../CurrentBtcPrice'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'

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
