import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {useCallback, useEffect, useMemo} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {
  chatWithMessagesKeys,
  otherSideDataAtom,
} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import calculatePercentageDifference from '../../../../../../utils/calculatePercentageDifference'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {showDonationPromptGiveLoveActionAtom} from '../../../../../DonationPrompt/atoms'
import Info from '../../../../../Info'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import {
  btcPriceForOfferWithStateAtom,
  tradePriceTypeAtom,
} from '../../../../../TradeCalculator/atoms'
import TradeCalculator from '../../../../../TradeCalculator/components/TradeCalculator'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import Content from '../../../Content'
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
}: Props): JSX.Element {
  const {t} = useTranslation()

  const isOtherSideAmountDataNewerThanMine = useAtomValue(
    isOtherSideAmountDataNewerThanMineAtom
  )
  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

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
  const showDonationPromptGiveLove = useSetAtom(
    showDonationPromptGiveLoveActionAtom
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
            void submitTradeChecklistUpdates()()
              .then(() => {
                if (isOtherSideAmountDataNewerThanMine)
                  void Effect.runFork(showDonationPromptGiveLove())
              })
              .finally(() => {
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
    isOtherSideAmountDataNewerThanMine,
    showDonationPromptGiveLove,
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
        title={t('tradeChecklist.calculateAmount.calculateAmount')}
      />
      <Content scrollable>
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
                username: otherSideData.userName,
                percentage: btcPricePercentageDifference,
              }
            )} ${
              btcPricePercentageDifference >= 0
                ? t('vexlbot.higherThanLivePrice')
                : t('vexlbot.lowerThanLivePrice')
            }`}
          />
        </TradeCalculator>
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
