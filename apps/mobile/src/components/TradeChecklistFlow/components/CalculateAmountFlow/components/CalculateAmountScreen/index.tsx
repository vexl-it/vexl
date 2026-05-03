import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import calculatePercentageDifference from '../../../../../../utils/calculatePercentageDifference'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import Info from '../../../../../Info'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  btcPriceForOfferWithStateAtom,
  tradePriceTypeAtom,
} from '../../../../../TradeCalculator/atoms'
import TradeCalculator from '../../../../../TradeCalculator/components/TradeCalculator'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  isOtherSideAmountDataNewerThanMineAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
  syncDataWithChatStateActionAtom,
} from '../../atoms'

type Props = TradeChecklistStackScreenProps<'CalculateAmount'>

function CalculateAmountScreen({
  navigation,
  route: {
    params: {amountData},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()

  const isOtherSideAmountDataNewerThanMine = useAtomValue(
    isOtherSideAmountDataNewerThanMineAtom
  )
  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

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

  const btcPricePercentageDifference = useMemo(() => {
    if (tradePriceType === 'custom' && amountData?.btcPrice)
      return calculatePercentageDifference(
        amountData.btcPrice,
        btcPriceForOfferWithState?.btcPrice?.BTC
      )

    return 0
  }, [amountData?.btcPrice, btcPriceForOfferWithState, tradePriceType])

  const onFooterButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      void saveLocalCalculatedAmountDataStateToMainState()().then((success) => {
        if (success) {
          if (shouldNavigateBackToChatOnSave) {
            showLoadingOverlay(true)
            void Effect.runPromise(submitTradeChecklistUpdates()).finally(
              () => {
                showLoadingOverlay(false)
              }
            )
            navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
          } else {
            navigation.popTo('AgreeOnTradeDetails')
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
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.calculateAmount.calculateAmount'),
      }}
      bottomButton={{
        disabled: saveButtonDisabled,
        onPress: onFooterButtonPress,
        text: isOtherSideAmountDataNewerThanMine
          ? t('common.accept')
          : t('common.save'),
        variant: 'secondary',
      }}
    >
      <TradeCalculator
        onPremiumOrDiscountPress={() => {
          navigation.navigate('PremiumOrDiscount')
        }}
      >
        <Info
          hideCloseButton
          variant="yellow"
          text={`${t(
            'tradeChecklist.calculateAmount.choseToCalculateWithCustomPrice',
            {
              username: t('common.otherSide'),
              percentage: btcPricePercentageDifference,
            }
          )} ${
            btcPricePercentageDifference >= 0
              ? t('vexlbot.higherThanLivePrice')
              : t('vexlbot.lowerThanLivePrice')
          }`}
        />
      </TradeCalculator>
    </TradeChecklistItemPageLayout>
  )
}

export default CalculateAmountScreen
